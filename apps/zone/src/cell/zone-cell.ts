/**
 * Role: authoritative runtime of one cell: players join through the bus, inputs are simulated with @skyline/physics at 20 Hz, acks and snapshots go back on each session subject.
 * Owner: backend
 */

import { type CellInput, type CellJoin, type CellLeave, type MessageBus, subjects, type Unsubscribe } from '@skyline/bus';
import type { UtmPosition } from '@skyline/geo';
import type { Logger } from '@skyline/observability';
import { type CharacterState, type CollisionWorld, FIXED_STEP_S, stepCharacter } from '@skyline/physics';
import { type EntityState, MAX_SNAPSHOT_ENTITIES, PROTOCOL_VERSION, type ServerMessage } from '@skyline/protocol';
import type { ClockSegment } from '@skyline/sim-clock';
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
}

export class ZoneCell {
  private readonly players = new Map<string, PlayerSlot>();
  private readonly stats = new TickStats();
  private readonly unsubscribes: Unsubscribe[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private tick = 0;
  private nextEntityId = 1;

  constructor(private readonly options: ZoneCellOptions) {}

  /** Subscribes to the cell subjects; `ticking: false` lets tests drive `step()` themselves. */
  start({ ticking = true }: { ticking?: boolean } = {}): void {
    const { bus, cellKey } = this.options;
    this.unsubscribes.push(
      bus.subscribe<CellJoin>(subjects.cellJoin(cellKey), (m) => void this.join(m.sessionId)),
      bus.subscribe<CellInput>(subjects.cellInput(cellKey), (m) => this.players.get(m.sessionId)?.offer(m.input)),
      bus.subscribe<CellLeave>(subjects.cellLeave(cellKey), (m) => this.players.delete(m.sessionId)),
    );
    if (ticking) this.timer = setInterval(() => this.step(), 1000 / TICK_RATE_HZ);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.unsubscribes.splice(0).forEach((u) => u());
  }

  tickStats(): TickStatsSnapshot {
    return this.stats.snapshot(this.players.size);
  }

  /** One simulation tick (public for tests). */
  step(): void {
    const started = performance.now();
    this.tick++;
    for (const player of this.players.values()) this.simulate(player);
    if (this.tick % SNAPSHOT_EVERY_TICKS === 0) this.broadcastSnapshot();
    this.stats.record(performance.now() - started);
  }

  private async join(sessionId: string): Promise<void> {
    const { spawn } = this.options;
    const state: CharacterState = { position: { x: spawn.x, y: 0, z: spawn.z }, velocity: { x: 0, y: 0, z: 0 }, grounded: true };
    const player = new PlayerSlot(sessionId, this.nextEntityId++, state);
    this.players.set(sessionId, player);
    this.send(sessionId, {
      type: 'welcome',
      body: { protocolVersion: PROTOCOL_VERSION, playerEntityId: player.entityId, tickRateHz: TICK_RATE_HZ, frameOrigin: this.options.frameOrigin, cellKey: this.options.cellKey },
    });
    this.send(sessionId, { type: 'worldClock', body: await this.options.clock() });
  }

  private simulate(player: PlayerSlot): void {
    const inputs = player.takeForTick();
    if (inputs.length === 0) {
      player.state = stepCharacter(this.options.world, player.state, { ...player.lastInput, moveX: 0, moveZ: 0, jump: false });
    }
    for (const input of inputs) {
      player.lastInput = { moveX: input.moveX, moveZ: input.moveZ, yawRad: input.yawRad, run: input.flags.run, jump: input.flags.jump };
      player.state = stepCharacter(this.options.world, player.state, player.lastInput, { dt: FIXED_STEP_S });
      player.lastSeq = input.seq;
    }
    if (player.violations > MAX_VIOLATIONS) {
      this.options.logger.warn({ entityId: player.entityId, violations: player.violations }, 'too many input violations, player removed');
      this.send(player.sessionId, { type: 'error', body: { code: 'rate_limited', message: 'too many invalid inputs' } });
      this.players.delete(player.sessionId);
      return;
    }
    this.send(player.sessionId, {
      type: 'inputAck',
      body: { lastSeq: Math.max(player.lastSeq, 0), tick: this.tick, position: player.state.position, velocity: player.state.velocity },
    });
  }

  private broadcastSnapshot(): void {
    const entities: EntityState[] = [...this.players.values()]
      .slice(0, MAX_SNAPSHOT_ENTITIES)
      .map((p) => ({ id: p.entityId, position: p.state.position, yawRad: p.lastInput.yawRad, state: entityStateCode(p.state) }));
    for (const player of this.players.values()) this.send(player.sessionId, { type: 'snapshot', body: { tick: this.tick, entities } });
  }

  private send(sessionId: string, message: ServerMessage): void {
    this.options.bus.publish(subjects.sessionOut(sessionId), message);
  }
}
