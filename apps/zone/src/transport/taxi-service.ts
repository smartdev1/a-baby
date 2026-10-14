/**
 * Role: metered taxis of a cell (ARCHITECTURE §17.1): hailed from a street towards a typed place, a taxi of the virtual fleet is assigned with a deterministic ETA; it picks the player up only if they waited by the road, charges pickup + distance of the A* road route once (`fare:{characterId}:{requestId}`), drives the route in an accelerated trip and drops the player in front of the place.
 * Owner: backend
 */

import type { TaxiFare } from '@skyline/content-schema';
import { characterAccount, type EconomyPort } from '@skyline/economy-rules';
import type { UtmPosition } from '@skyline/geo';
import type { ServerMessage, TaxiRefusal, TaxiRequestMessage, TaxiUpdateMessage } from '@skyline/protocol';
import { findRoute, type Point } from '@skyline/sim-transport';
import type { CityMap } from './city-map.ts';
import type { RidePlayers } from './ride-service.ts';

export const HAIL_RADIUS_M = 30;
const WAIT_RADIUS_M = 40;
const DROP_SEARCH_M = 300;
const MIN_ETA_MS = 2000;
const MAX_ETA_MS = 60_000;
const MIN_TRIP_MS = 3000;
const MAX_TRIP_MS = 30_000;
const ACCELERATION = 6;

export interface TaxiDeps {
  readonly map: CityMap;
  readonly fare: Pick<TaxiFare, 'pickupDjai' | 'perKmDjai' | 'cruiseKmh' | 'etaGameMin'>;
  readonly economy: EconomyPort;
  readonly clockRatio: () => number;
  readonly realNow: () => number;
  readonly reachable: (utm: UtmPosition) => boolean;
  /** True when the player is already busy with another transport (a line ride). */
  readonly busyElsewhere: (sessionId: string) => boolean;
  readonly send: (sessionId: string, message: ServerMessage) => void;
  readonly refreshWallet: (sessionId: string, txId: string) => Promise<void>;
}

interface Job {
  phase: 'waiting' | 'boarding' | 'aboard';
  dueAtMs: number;
  readonly sessionId: string;
  readonly pickup: UtmPosition;
  readonly drop: UtmPosition;
  readonly tripMs: number;
  readonly update: TaxiUpdateMessage;
}

type Planned = { readonly pickup: UtmPosition; readonly drop: UtmPosition; readonly distanceM: number } | { readonly refusal: TaxiRefusal };

const utmOf = (p: Point): UtmPosition => ({ eastingM: p[0], northingM: p[1] });
const distance = (a: UtmPosition, b: UtmPosition): number => Math.hypot(a.eastingM - b.eastingM, a.northingM - b.northingM);
const clamp = (x: number, lo: number, hi: number): number => Math.round(Math.min(hi, Math.max(lo, x)));

/** FNV-1a of a key as a fraction in [0, 1): the fleet's answer is the same for the same request. */
const fractionOf = (key: string): number => {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 0x01000193) >>> 0;
  return h / 2 ** 32;
};

export class TaxiService {
  private readonly jobs = new Map<string, Job>();
  /** Last update per `sessionId:requestId`: a replayed request gets it again. */
  private readonly answered = new Map<string, TaxiUpdateMessage>();

  constructor(
    private readonly deps: TaxiDeps,
    private readonly players: RidePlayers,
  ) {}

  hasJob(sessionId: string): boolean {
    return this.jobs.has(sessionId);
  }

  isAboard(sessionId: string): boolean {
    const phase = this.jobs.get(sessionId)?.phase;
    return phase === 'aboard' || phase === 'boarding';
  }

  async request(sessionId: string, body: TaxiRequestMessage): Promise<void> {
    const replay = this.answered.get(`${sessionId}:${body.requestId}`);
    if (replay) return this.deps.send(sessionId, { type: 'taxiUpdate', body: replay });
    if (this.jobs.has(sessionId) || this.deps.busyElsewhere(sessionId)) return this.reject(sessionId, body, 'busy');
    const planned = this.plan(sessionId, body);
    if ('refusal' in planned) return this.reject(sessionId, body, planned.refusal);
    const characterId = this.players.characterOf(sessionId);
    if (characterId === null) return this.reject(sessionId, body, 'unavailable');
    const fareDjai = this.deps.fare.pickupDjai + Math.ceil((planned.distanceM / 1000) * this.deps.fare.perKmDjai);
    if ((await this.deps.economy.balanceOf(characterAccount(characterId))) < BigInt(fareDjai)) return this.reject(sessionId, body, 'insufficient_funds');
    if (this.jobs.has(sessionId)) return this.reject(sessionId, body, 'busy');
    const etaMs = this.etaMs(`${sessionId}:${body.requestId}`);
    const update: TaxiUpdateMessage = { requestId: body.requestId, destinationPlaceId: body.destinationPlaceId, state: 'assigned', etaMs, fareDjai, distanceM: Math.round(planned.distanceM), refusals: [] };
    this.jobs.set(sessionId, { phase: 'waiting', dueAtMs: this.deps.realNow() + etaMs, sessionId, pickup: planned.pickup, drop: planned.drop, tripMs: this.tripMs(planned.distanceM), update });
    this.tell(sessionId, update);
  }

  /** Pickups and arrivals that are due; returns the players to put back in the street. */
  step(): { sessionId: string; destination: UtmPosition }[] {
    const now = this.deps.realNow();
    const out: { sessionId: string; destination: UtmPosition }[] = [];
    for (const job of this.jobs.values()) {
      if (job.dueAtMs > now) continue;
      if (job.phase === 'waiting') void this.pickUp(job);
      else if (job.phase === 'aboard') {
        this.jobs.delete(job.sessionId);
        this.tell(job.sessionId, { ...job.update, state: 'arrived', etaMs: 0 });
        out.push({ sessionId: job.sessionId, destination: job.drop });
      }
    }
    return out;
  }

  remove(sessionId: string): void {
    this.jobs.delete(sessionId);
  }

  private plan(sessionId: string, body: TaxiRequestMessage): Planned {
    const here = this.players.utmOf(sessionId);
    const { roads, places } = this.deps.map;
    const from = here ? roads.nearestNode([here.eastingM, here.northingM], 'car', HAIL_RADIUS_M, true) : null;
    if (from === null) return { refusal: 'no_road_nearby' };
    const place = places.get(body.destinationPlaceId);
    if (!place) return { refusal: 'unknown_place' };
    if (!this.deps.reachable(place)) return { refusal: 'unreachable' };
    const to = roads.nearestNode([place.eastingM, place.northingM], 'car', DROP_SEARCH_M, true);
    const route = to === null ? null : findRoute(roads, { from, to, mode: 'car' });
    if (to === null || !route) return { refusal: 'no_route' };
    const drop = utmOf(roads.positions[to] as Point);
    if (!this.deps.reachable(drop)) return { refusal: 'unreachable' };
    return { pickup: utmOf(roads.positions[from] as Point), drop, distanceM: route.lengthM };
  }

  /** The taxi is there: the player must still be by the road; the fare is charged as they get in. */
  private async pickUp(job: Job): Promise<void> {
    const here = this.players.utmOf(job.sessionId);
    const characterId = this.players.characterOf(job.sessionId);
    if (!here || characterId === null || distance(here, job.pickup) > WAIT_RADIUS_M) return this.cancel(job, 'missed');
    job.phase = 'boarding';
    const fare = BigInt(job.update.fareDjai);
    const result = await this.deps.economy.commit({
      idempotencyKey: `fare:${characterId}:${job.update.requestId}`,
      kind: 'fare',
      legs: [
        { account: characterAccount(characterId), amount: -fare },
        { account: 'system:transport', amount: fare },
      ],
      reason: { requestId: job.update.requestId },
    });
    if (this.jobs.get(job.sessionId) !== job) return; // left meanwhile
    if (!result.ok) return this.cancel(job, result.code === 'INSUFFICIENT_FUNDS' ? 'insufficient_funds' : 'unavailable');
    job.phase = 'aboard';
    job.dueAtMs = this.deps.realNow() + job.tripMs;
    await this.deps.refreshWallet(job.sessionId, result.txId);
    this.tell(job.sessionId, { ...job.update, state: 'boarded', etaMs: job.tripMs });
  }

  private cancel(job: Job, code: TaxiRefusal): void {
    this.jobs.delete(job.sessionId);
    this.tell(job.sessionId, { ...job.update, state: 'cancelled', etaMs: 0, refusals: [{ code }] });
  }

  private etaMs(key: string): number {
    const { min, max } = this.deps.fare.etaGameMin;
    const gameMin = min + fractionOf(key) * (max - min);
    const ratio = this.deps.clockRatio();
    return ratio > 0 ? clamp((gameMin / ratio) * 60_000, MIN_ETA_MS, MAX_ETA_MS) : MAX_ETA_MS;
  }

  /** A sixth of the real drive at the visible speed, between 3 and 30 s. */
  private tripMs(distanceM: number): number {
    return clamp(((distanceM / 1000 / this.deps.fare.cruiseKmh) * 3_600_000) / ACCELERATION, MIN_TRIP_MS, MAX_TRIP_MS);
  }

  private tell(sessionId: string, update: TaxiUpdateMessage): void {
    this.answered.set(`${sessionId}:${update.requestId}`, update);
    if (this.answered.size > 10_000) this.answered.delete(this.answered.keys().next().value as string);
    this.deps.send(sessionId, { type: 'taxiUpdate', body: update });
  }

  private reject(sessionId: string, body: TaxiRequestMessage, code: TaxiRefusal): void {
    this.deps.send(sessionId, { type: 'taxiUpdate', body: { requestId: body.requestId, destinationPlaceId: body.destinationPlaceId, state: 'rejected', etaMs: 0, fareDjai: 0, distanceM: 0, refusals: [{ code }] } });
  }
}
