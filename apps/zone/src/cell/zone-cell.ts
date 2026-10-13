/**
 * Role: authoritative runtime of one cell: players join through the bus or a border handoff, inputs are simulated with @skyline/physics at 20 Hz, acks go back on each session subject and one snapshot per cell on the cell subject.
 * Owner: backend
 */

import {
  type CellInput,
  type CellJoin,
  type CellLeave,
  type MessageBus,
  subjects,
  type Unsubscribe,
} from '@skyline/bus';
import type { UtmPosition } from '@skyline/geo';
import type { Logger } from '@skyline/observability';
import { type CharacterState, type CollisionWorld, FIXED_STEP_S, stepCharacter } from '@skyline/physics';
import { type EntityState, MAX_SNAPSHOT_ENTITIES, PROTOCOL_VERSION, type ServerMessage } from '@skyline/protocol';
import type { ClockSegment } from '@skyline/sim-clock';
import { entityIdOf, leftCellTowards, stateFromHandoff, toHandoff } from '../handoff/cell-handoff.ts';
import { InputForwarding } from '../handoff/input-forwarding.ts';
import { entityStateCode } from './entity-state-code.ts';
import { PlayerSlot } from './player-slot.ts';
import { TickStats, type TickStatsSnapshot } from './tick-stats.ts';

export const TICK_RATE_HZ = 20;
/** Snapshots every 2 ticks (10 Hz); acks every tick. */
const SNAPSHOT_EVERY_TICKS = 2;
const MAX_VIOLATIONS = 50;

export interface ZoneCellOptions {
  readonly cellKey: string;
  readonly bus: MessageBus;
  readonly world: CollisionWorld;
  readonly frameOrigin: UtmPosition;
  /** Spawn point in frame metres. */
  readonly spawn: { readonly x: number; readonly z: number };
  readonly clock: () => Promise<ClockSegment>;
  readonly logger: Logger;
  /** Cells owned by a running zone (this one included): players may only cross into them. Default: this cell only. */
  readonly clusterCells?: ReadonlySet<string>;
}

export class ZoneCell {
  private readonly players = new Map<string, PlayerSlot>();
  private readonly stats = new TickStats();
  private readonly unsubscribes: Unsubscribe[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private tick = 0;
  private readonly handoffMs: number[] = [];
  private readonly forwarding = new InputForwarding();

  constructor(private readonly options: ZoneCellOptions) {}

  /** Subscribes to the cell subjects; `ticking: false` lets tests drive `step()` themselves. */
  start({ ticking = true }: { ticking?: boolean } = {}): void {
    const { bus, cellKey } = this.options;
    this.unsubscribes.push(
      bus.subscribe<CellJoin>(subjects.cellJoin(cellKey), (m) => void this.join(m.sessionId)),
      bus.subscribe<CellInput>(subjects.cellInput(cellKey), (m) => this.input(m)),
      bus.subscribe<SessionClosed>(subjects.sessionClosed(), (m) => {
        this.players.delete(m.sessionId);
        this.forwarding.remove(m.sessionId);
      }),
      bus.subscribe<CellHandoff>(subjects.cellHandoff(cellKey), (m) => void this.adopt(m)),
    );
    if (ticking) this.timer = setInterval(() => this.step(), 1000 / TICK_RATE_HZ);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.unsubscribes.splice(0).forEach((u) => u());
  }

  tickStats(): TickStatsSnapshot & { handoffsIn: number; handoffP95Ms: number } {
    const sorted = [...this.handoffMs].sort((a, b) => a - b);
    const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] ?? 0;
    return { ...this.stats.snapshot(this.players.size), handoffsIn: this.handoffMs.length, handoffP95Ms: Math.round(p95 * 100) / 100 };
  }

  /** One simulation tick (public for tests). */
  step(): void {
    const started = performance.now();
    this.tick++;
    for (const player of this.players.values()) this.simulate(player);
    if (this.tick % SNAPSHOT_EVERY_TICKS === 0) this.broadcastSnapshot();
    if (this.tick % TICK_RATE_HZ === 0) this.forwarding.prune(this.tick);
    this.stats.record(performance.now() - started);
  }

  private input(m: CellInput): void {
    const player = this.players.get(m.sessionId);
    if (player) {
      player.offer(m.input);
      return;
    }
    const target = this.forwarding.targetOf(m.sessionId);
    if (target) this.options.bus.publish(subjects.cellInput(target), m);
  }

  private async join(sessionId: string): Promise<void> {
    const { spawn } = this.options;
    const state: CharacterState = {
      position: { x: spawn.x, y: 0, z: spawn.z },
      velocity: { x: 0, y: 0, z: 0 },
      grounded: true,
    };
    const player = new PlayerSlot(sessionId, this.nextEntityId++, state);
    this.players.set(sessionId, player);
    this.send(sessionId, {
      type: 'welcome',
      body: {
        protocolVersion: PROTOCOL_VERSION,
        playerEntityId: player.entityId,
        tickRateHz: TICK_RATE_HZ,
        frameOrigin: this.options.frameOrigin,
        cellKey: this.options.cellKey,
      },
    });
    this.send(sessionId, { type: 'worldClock', body: await this.options.clock() });
  }

  private simulate(player: PlayerSlot): void {
    const before = player.state;
    const inputs = player.takeForTick();
    if (inputs.length === 0) {
      player.state = stepCharacter(this.options.world, player.state, {
        ...player.lastInput,
        moveX: 0,
        moveZ: 0,
        jump: false,
      });
    }
    for (const input of inputs) {
      player.lastInput = {
        moveX: input.moveX,
        moveZ: input.moveZ,
        yawRad: input.yawRad,
        run: input.flags.run,
        jump: input.flags.jump,
      };
      player.state = stepCharacter(this.options.world, player.state, player.lastInput, { dt: FIXED_STEP_S });
      player.lastSeq = input.seq;
    }
    if (this.crossBorder(player, before)) return;
    if (player.violations > MAX_VIOLATIONS) {
      this.options.logger.warn(
        { entityId: player.entityId, violations: player.violations },
        'too many input violations, player removed',
      );
      this.send(player.sessionId, {
        type: 'error',
        body: { code: 'rate_limited', message: 'too many invalid inputs' },
      });
      this.players.delete(player.sessionId);
      return;
    }
    this.send(player.sessionId, {
      type: 'inputAck',
      body: {
        lastSeq: Math.max(player.lastSeq, 0),
        tick: this.tick,
        position: player.state.position,
        velocity: player.state.velocity,
      },
    });
  }

  /** True when the player was handed to another cell; a move into an unowned cell is undone. */
  private crossBorder(player: PlayerSlot, before: CharacterState): boolean {
    const target = leftCellTowards(player.state, this.options.frameOrigin);
    if (target === null) return false;
    const cluster = this.options.clusterCells ?? new Set([this.options.cellKey]);
    if (target === this.options.cellKey || !cluster.has(target)) {
      player.state = { ...before, velocity: { x: 0, y: before.velocity.y, z: 0 } };
      return false;
    }
    this.options.bus.publish(subjects.cellHandoff(target), toHandoff({ ...player, yawRad: player.lastInput.yawRad }, this.options.frameOrigin, Date.now()));
    this.players.delete(player.sessionId);
    this.forwarding.add(player.sessionId, target, this.tick);
    return true;
  }

  private broadcastSnapshot(): void {
    const entities: EntityState[] = [...this.players.values()].slice(0, MAX_SNAPSHOT_ENTITIES).map((p) => ({
      id: p.entityId,
      position: p.state.position,
      yawRad: p.lastInput.yawRad,
      state: entityStateCode(p.state),
    }));
    for (const player of this.players.values())
      this.send(player.sessionId, { type: 'snapshot', body: { tick: this.tick, entities } });
  }

  private send(sessionId: string, message: ServerMessage): void {
    this.options.bus.publish(subjects.sessionOut(sessionId), message);
  }
}
