/**
 * Role: authoritative runtime of one cell: players join through the bus or a border handoff (20 m hysteresis), inputs are simulated with @skyline/physics at 20 Hz, acks go back on each session subject and one snapshot per cell (own players + neighbours' border ghosts) on the cell subject; characters are saved every 60 s and restored on join when a store is given; daily life (actions, needs, Djai) runs at 1 Hz, transport (line rides, taxis) and the proximity chat when configured.
 * Owner: backend
 */

import {
  type CellAction,
  type CellChat,
  type CellGhosts,
  type CellHandoff,
  type CellSnapshot,
  type GhostEntity,
  type CellInput,
  type CellJoin,
  type MessageBus,
  type SessionClosed,
  subjects,
  type Unsubscribe,
} from '@skyline/bus';
import type { UtmPosition } from '@skyline/geo';
import type { Logger } from '@skyline/observability';
import { type CharacterState, type CollisionWorld, FIXED_STEP_S, stepCharacter } from '@skyline/physics';
import { type EntityState, type InputMessage, MAX_SNAPSHOT_ENTITIES, PROTOCOL_VERSION, type ServerMessage } from '@skyline/protocol';
import type { ClockSegment } from '@skyline/sim-clock';
import { DailyLife, type DailyLifeDeps, type PlayerPositions } from '../actions/daily-life.ts';
import { type ChatPlayers, ProximityChat, type ProximityChatDeps } from '../chat/proximity-chat.ts';
import { depthOutsideM, entityIdOf, HANDOFF_HYSTERESIS_M, leftCellTowards, stateFromHandoff, toHandoff } from '../handoff/cell-handoff.ts';
import { GhostBoard, ghostTargets, nearBorder, toGhost } from '../handoff/cell-ghosts.ts';
import type { TaxiFare } from '@skyline/content-schema';
import type { CityMap } from '../transport/city-map.ts';
import { type CellTransport, createCellTransport, stateAtStop } from '../transport/cell-rides.ts';
import type { TransitNetwork } from '../transport/transit-network.ts';
import { InputForwarding } from '../handoff/input-forwarding.ts';
import { entityStateCode } from './entity-state-code.ts';
import { CharacterCheckpoints, CHECKPOINT_EVERY_MS, type CheckpointSubject } from './character-checkpoints.ts';
import { PlayerSlot } from './player-slot.ts';
import type { CharacterStorePort } from '../ports/character-store-port.ts';
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
  /** Daily life (actions, needs, Djai); absent = movement only. */
  readonly daily?: Omit<DailyLifeDeps, 'send'>;
  /** Proximity chat (word list, moderation queue); absent = no chat. */
  readonly chat?: Pick<ProximityChatDeps, 'blockedWords' | 'reports'>;
  /** Transit lines and city map of the commune: transport needs daily life too (fares, game clock). */
  readonly transport?: { readonly transit: TransitNetwork; readonly city?: CityMap; readonly taxiFare?: TaxiFare };
  /** Saved characters (position, needs); absent = nothing persisted. */
  readonly characters?: CharacterStorePort;
}

export class ZoneCell implements PlayerPositions, ChatPlayers {
  private readonly players = new Map<string, PlayerSlot>();
  private readonly stats = new TickStats();
  private readonly unsubscribes: Unsubscribe[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private tick = 0;
  private readonly handoffMs: number[] = [];
  private readonly forwarding = new InputForwarding();
  private readonly ghosts = new GhostBoard();
  private readonly daily: DailyLife | null;
  private readonly chat: ProximityChat | null;
  private readonly transport: CellTransport | null;
  private readonly checkpoints: CharacterCheckpoints | null;
  /** Session → character for guest accounts (anonymous dev sessions are not saved). */
  private readonly characterIds = new Map<string, string>();

  constructor(private readonly options: ZoneCellOptions) {
    this.daily = options.daily ? new DailyLife({ ...options.daily, send: (sessionId, m) => this.send(sessionId, m) }, this) : null;
    const send = (sessionId: string, m: ServerMessage): void => this.send(sessionId, m);
    this.chat = options.chat ? new ProximityChat({ ...options.chat, cellKey: options.cellKey, send, now: () => Date.now() }, this) : null;
    const { daily, transport, frameOrigin } = options;
    const cluster = options.clusterCells ?? new Set([options.cellKey]);
    const sources = transport ? { network: transport.transit, ...(transport.city ? { city: transport.city } : {}), ...(transport.taxiFare ? { taxiFare: transport.taxiFare } : {}) } : null;
    this.checkpoints = options.characters ? new CharacterCheckpoints(options.characters, frameOrigin, cluster, options.logger) : null;
    this.transport = this.daily && daily && sources ? createCellTransport({ ...sources, daily: this.daily, dailyDeps: daily, cluster, frameOrigin, send, positionOf: (s) => this.positionOf(s) }) : null;
  }

  entityOf(sessionId: string): number | null {
    return this.players.get(sessionId)?.entityId ?? null;
  }

  sessionsWithin(sessionId: string, radiusM: number, limit: number): string[] {
    const me = this.positionOf(sessionId);
    if (!me) return [];
    const near: { id: string; d: number }[] = [];
    for (const [id, other] of this.players) {
      const d = Math.hypot(other.state.position.x - me.x, other.state.position.z - me.z);
      if (d <= radiusM) near.push({ id, d });
    }
    if (near.length > limit) near.sort((a, b) => a.d - b.d);
    return near.slice(0, limit).map((n) => n.id);
  }

  positionOf(sessionId: string): { x: number; z: number } | null {
    const p = this.players.get(sessionId)?.state.position;
    return p ? { x: p.x, z: p.z } : null;
  }

  nearby(sessionId: string, radiusM: number): number {
    const me = this.positionOf(sessionId);
    if (!me) return 0;
    let n = 0;
    for (const [id, other] of this.players) if (id !== sessionId && Math.hypot(other.state.position.x - me.x, other.state.position.z - me.z) <= radiusM) n++;
    return n;
  }

  /** Subscribes to the cell subjects; `ticking: false` lets tests drive `step()` themselves. */
  start({ ticking = true }: { ticking?: boolean } = {}): void {
    const { bus, cellKey } = this.options;
    this.unsubscribes.push(
      bus.subscribe<CellJoin>(subjects.cellJoin(cellKey), (m) => void this.join(m.sessionId, m.characterId)),
      bus.subscribe<CellInput>(subjects.cellInput(cellKey), (m) => this.input(m)),
      bus.subscribe<SessionClosed>(subjects.sessionClosed(), (m) => {
        void this.checkpoint([m.sessionId]);
        this.characterIds.delete(m.sessionId);
        this.players.delete(m.sessionId);
        this.forwarding.remove(m.sessionId);
        void this.daily?.removePlayer(m.sessionId, 'disconnected');
        this.chat?.remove(m.sessionId);
        this.transport?.remove(m.sessionId);
      }),
      bus.subscribe<CellChat>(subjects.cellChat(cellKey), (m) => void this.chat?.handle(m.sessionId, m.message)),
      bus.subscribe<CellAction>(subjects.cellAction(cellKey), (m) =>
        void (m.message.type === 'rideRequest' || m.message.type === 'taxiRequest' ? this.transport?.handle(m.sessionId, m.message) : this.daily?.handle(m.sessionId, m.message)),
      ),
      bus.subscribe<CellHandoff>(subjects.cellHandoff(cellKey), (m) => void this.adopt(m)),
      bus.subscribe<CellGhosts>(subjects.cellGhosts(cellKey), (m) => this.ghosts.accept(m, Date.now())),
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
    return {
      ...this.stats.snapshot(this.players.size),
      handoffsIn: this.handoffMs.length,
      handoffP95Ms: Math.round(p95 * 100) / 100,
    };
  }

  /** One simulation tick (public for tests). */
  step(): void {
    const started = performance.now();
    this.tick++;
    for (const { sessionId, destination } of this.transport?.arrivals() ?? []) {
      const player = this.players.get(sessionId);
      if (player) player.state = stateAtStop(this.options.world, this.options.frameOrigin, destination);
    }
    for (const player of this.players.values()) this.simulate(player);
    if (this.tick % SNAPSHOT_EVERY_TICKS === 0) this.broadcastSnapshot();
    if (this.tick % TICK_RATE_HZ === 0) {
      this.forwarding.prune(this.tick);
      void this.daily?.tick(Date.now());
    }
    if (this.tick % ((CHECKPOINT_EVERY_MS / 1000) * TICK_RATE_HZ) === 0) void this.checkpoint([...this.characterIds.keys()]);
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

  /** `characterId`: the guest account; an anonymous dev session plays a throw-away character named after the session. */
  private async join(sessionId: string, characterId = sessionId): Promise<void> {
    const present = this.players.get(sessionId);
    if (present) return this.rejoin(present);
    const guest = characterId !== sessionId;
    const saved = guest ? await this.checkpoints?.restore(characterId) : null;
    if (guest) this.characterIds.set(sessionId, characterId);
    const player = new PlayerSlot(sessionId, entityIdOf(sessionId), saved?.state ?? this.spawnState());
    if (saved) player.lastInput = { ...player.lastInput, yawRad: saved.yawRad };
    await this.welcome(player);
    await this.daily?.addPlayer(sessionId, saved?.needs ?? undefined, characterId);
  }

  /** A resumed session (its connection dropped less than 60 s ago): same player, same state, welcomed again. */
  private async rejoin(player: PlayerSlot): Promise<void> {
    await this.welcome(player);
    await this.daily?.resync(player.sessionId);
  }

  private spawnState(): CharacterState {
    const { spawn, world } = this.options;
    return { position: { x: spawn.x, y: world.groundHeightAt(spawn.x, spawn.z), z: spawn.z }, velocity: { x: 0, y: 0, z: 0 }, grounded: true };
  }

  /** Saves the given players' characters (guest accounts only). */
  private async checkpoint(sessionIds: readonly string[]): Promise<void> {
    if (!this.checkpoints) return;
    const subjects: CheckpointSubject[] = [];
    for (const sessionId of sessionIds) {
      const characterId = this.characterIds.get(sessionId);
      const player = this.players.get(sessionId);
      if (characterId && player) subjects.push({ characterId, state: player.state, yawRad: player.lastInput.yawRad, needs: this.daily?.needsOf(sessionId)?.values ?? null });
    }
    await this.checkpoints.save(subjects, Date.now());
  }

  /** A player handed over by a neighbour cell keeps its state, sequence and entity id. */
  private async adopt(h: CellHandoff): Promise<void> {
    const player = new PlayerSlot(h.sessionId, h.entityId, stateFromHandoff(h, this.options.frameOrigin));
    player.lastSeq = h.lastSeq;
    player.lastInput = { ...player.lastInput, yawRad: h.yawRad };
    this.handoffMs.push(Date.now() - h.sentAtMs);
    if (this.handoffMs.length > 10_000) this.handoffMs.shift();
    await this.welcome(player);
    await this.daily?.addPlayer(h.sessionId, h.needs, h.characterId ?? h.sessionId);
    this.chat?.restoreBlocks(h.sessionId, h.chatBlocked ?? []);
    if (h.characterId) this.characterIds.set(h.sessionId, h.characterId);
  }

  private async welcome(player: PlayerSlot): Promise<void> {
    const { sessionId } = player;
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
    if (this.transport?.isAboard(player.sessionId)) {
      // In the vehicle: movement inputs are acknowledged but ignored.
      for (const input of inputs) player.lastSeq = input.seq;
    } else {
      this.applyInputs(player, inputs);
      if (this.crossBorder(player, before)) return;
    }
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

  /** Physics of the tick: the queued inputs in order, or one idle step when none arrived. */
  private applyInputs(player: PlayerSlot, inputs: readonly InputMessage[]): void {
    if (inputs.length === 0) {
      player.state = stepCharacter(this.options.world, player.state, { ...player.lastInput, moveX: 0, moveZ: 0, jump: false });
    }
    for (const input of inputs) {
      player.lastInput = { moveX: input.moveX, moveZ: input.moveZ, yawRad: input.yawRad, run: input.flags.run, jump: input.flags.jump };
      player.state = stepCharacter(this.options.world, player.state, player.lastInput, { dt: FIXED_STEP_S });
      player.lastSeq = input.seq;
    }
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
    if (depthOutsideM(player.state) <= HANDOFF_HYSTERESIS_M) return false;
    this.options.bus.publish(subjects.cellHandoff(target), this.handoffOf(player));
    void this.daily?.removePlayer(player.sessionId, 'left_cell');
    this.chat?.remove(player.sessionId);
    this.characterIds.delete(player.sessionId);
    this.players.delete(player.sessionId);
    this.forwarding.add(player.sessionId, target, this.tick);
    return true;
  }

  /** Authoritative state plus what daily life and the chat carry to the next cell. */
  private handoffOf(player: PlayerSlot): CellHandoff {
    const handoff = toHandoff({ ...player, yawRad: player.lastInput.yawRad }, this.options.frameOrigin, Date.now());
    const needs = this.daily?.needsOf(player.sessionId)?.values;
    const chatBlocked = this.chat?.blocksOf(player.sessionId) ?? [];
    const characterId = this.daily?.characterOf(player.sessionId);
    return { ...handoff, ...(needs ? { needs } : {}), ...(chatBlocked.length > 0 ? { chatBlocked } : {}), ...(characterId && characterId !== player.sessionId ? { characterId } : {}) };
  }

  private broadcastSnapshot(): void {
    if (this.players.size === 0) return;
    // Riders are inside a vehicle: not in the street.
    const own: EntityState[] = [...this.players.values()].filter((p) => !this.transport?.isAboard(p.sessionId)).map((p) => ({
      id: p.entityId,
      position: p.state.position,
      yawRad: p.lastInput.yawRad,
      state: entityStateCode(p.state),
    }));
    this.publishGhosts(own);
    const ghosts = this.ghosts.entitiesIn(this.options.frameOrigin, Date.now(), new Set(own.map((e) => e.id)));
    const entities = [...own, ...ghosts].slice(0, MAX_SNAPSHOT_ENTITIES);
    const snapshot: CellSnapshot = { type: 'snapshot', body: { tick: this.tick, entities } };
    this.options.bus.publish(subjects.cellSnapshot(this.options.cellKey), snapshot);
  }

  /** Players near a border, sent read-only to the neighbour cells of the cluster that can see them. */
  private publishGhosts(own: readonly EntityState[]): void {
    const { clusterCells, cellKey, frameOrigin, bus } = this.options;
    if (!clusterCells || clusterCells.size < 2) return;
    const byTarget = new Map<string, GhostEntity[]>();
    for (const e of own) {
      if (!nearBorder(e.position.x, e.position.z)) continue;
      const ghost = toGhost(e, frameOrigin);
      for (const target of ghostTargets(cellKey, ghost)) {
        if (!clusterCells.has(target)) continue;
        const list = byTarget.get(target) ?? [];
        list.push(ghost);
        byTarget.set(target, list);
      }
    }
    for (const [target, entities] of byTarget) bus.publish(subjects.cellGhosts(target), { fromCell: cellKey, entities } satisfies CellGhosts);
  }

  private send(sessionId: string, message: ServerMessage): void {
    this.options.bus.publish(subjects.sessionOut(sessionId), message);
  }
}
