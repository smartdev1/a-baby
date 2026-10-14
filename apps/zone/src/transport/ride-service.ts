/**
 * Role: line rides of a cell (ARCHITECTURE §17.3): boarding is accepted only next to a stop of the line where a vehicle of the timetable is docked with a free seat, towards a later stop in an owned cell; the flat fare is paid once (`fare:{characterId}:{requestId}`), then the player leaves the street and reappears at the stop after a short accelerated trip.
 * Owner: backend
 */

import { characterAccount, type EconomyPort } from '@skyline/economy-rules';
import type { UtmPosition } from '@skyline/geo';
import type { RideRefusal, RideRequestMessage, RideUpdateMessage, ServerMessage } from '@skyline/protocol';
import { dockedVehicleAt, nextArrivalAt } from '@skyline/sim-transport';
import type { TransitLine, TransitNetwork } from './transit-network.ts';

export const BOARDING_RADIUS_M = 25;
const MIN_TRIP_MS = 3000;
const MAX_TRIP_MS = 20_000;
/** The accelerated trip lasts this share of the real trip time. */
const ACCELERATION = 6;

export interface RideDeps {
  readonly network: TransitNetwork;
  readonly economy: EconomyPort;
  readonly gameMinute: () => number;
  /** Live clock ratio (0 when paused). */
  readonly clockRatio: () => number;
  readonly realNow: () => number;
  /** True when the stop lies in a cell of the cluster (players never land in an unowned cell). */
  readonly reachable: (utm: UtmPosition) => boolean;
  readonly send: (sessionId: string, message: ServerMessage) => void;
  readonly refreshWallet: (sessionId: string, txId: string) => Promise<void>;
  /** True when the player is already busy with another transport (a taxi). */
  readonly busyElsewhere?: (sessionId: string) => boolean;
}

export interface RidePlayers {
  characterOf(sessionId: string): string | null;
  /** Absolute UTM position of the player. */
  utmOf(sessionId: string): UtmPosition | null;
}

interface Ride {
  readonly sessionId: string;
  readonly vehicleKey: string;
  readonly arriveAtMs: number;
  readonly destination: UtmPosition;
  readonly update: RideUpdateMessage;
}

interface Plan {
  readonly line: TransitLine;
  readonly from: number;
  readonly to: number;
  readonly vehicleKey: string;
}

type Checked = { readonly plan: Plan } | { readonly refusal: RideRefusal; readonly nextInGameMin?: number };

const distance = (a: UtmPosition, b: UtmPosition): number => Math.hypot(a.eastingM - b.eastingM, a.northingM - b.northingM);

export class RideService {
  private readonly rides = new Map<string, Ride>();
  private readonly pending = new Set<string>();
  private readonly passengers = new Map<string, number>();
  /** Successful updates per `sessionId:requestId`: a replayed request gets the same answer. */
  private readonly done = new Map<string, RideUpdateMessage>();

  constructor(
    private readonly deps: RideDeps,
    private readonly players: RidePlayers,
  ) {}

  isRiding(sessionId: string): boolean {
    return this.rides.has(sessionId);
  }

  async request(sessionId: string, body: RideRequestMessage): Promise<void> {
    const replay = this.done.get(`${sessionId}:${body.requestId}`);
    if (replay) return this.deps.send(sessionId, { type: 'rideUpdate', body: replay });
    if (this.rides.has(sessionId) || this.pending.has(sessionId) || this.deps.busyElsewhere?.(sessionId)) return this.reject(sessionId, body, { refusal: 'already_riding' });
    const checked = this.check(sessionId, body);
    if (!('plan' in checked)) return this.reject(sessionId, body, checked);
    this.pending.add(sessionId);
    try {
      await this.board(sessionId, body, checked.plan);
    } finally {
      this.pending.delete(sessionId);
    }
  }

  /** Rides whose accelerated trip is over: the players to put back in the street, at their stop. */
  arrivals(): { sessionId: string; destination: UtmPosition }[] {
    const now = this.deps.realNow();
    const out: { sessionId: string; destination: UtmPosition }[] = [];
    for (const ride of this.rides.values()) {
      if (ride.arriveAtMs > now) continue;
      this.end(ride);
      const update: RideUpdateMessage = { ...ride.update, state: 'arrived', arriveInMs: 0 };
      this.remember(ride.sessionId, update);
      this.deps.send(ride.sessionId, { type: 'rideUpdate', body: update });
      out.push({ sessionId: ride.sessionId, destination: ride.destination });
    }
    return out;
  }

  /** The player left (disconnected): the seat is freed, the fare is not refunded. */
  remove(sessionId: string): void {
    const ride = this.rides.get(sessionId);
    if (ride) this.end(ride);
  }

  private check(sessionId: string, body: RideRequestMessage): Checked {
    const line = this.deps.network.get(body.lineId);
    const here = this.players.utmOf(sessionId);
    if (!line || !here) return { refusal: line ? 'unavailable' : 'unknown_line' };
    const to = line.stops.findIndex((s) => s.id === body.toStopId);
    const near = line.stops.map((s, k) => ({ k, d: distance(s.utm, here) })).filter((n) => n.d <= BOARDING_RADIUS_M);
    const from = near.filter((n) => n.k < to).sort((a, b) => a.d - b.d)[0]?.k;
    if (from === undefined) return { refusal: near.length > 0 ? 'wrong_direction' : 'no_stop_nearby' };
    if (!this.deps.reachable((line.stops[to] as TransitLine['stops'][number]).utm)) return { refusal: 'unreachable' };
    const now = this.deps.gameMinute();
    const vehicle = dockedVehicleAt(line.schedule, from, now);
    if (!vehicle) {
      const next = nextArrivalAt(line.schedule, from, now);
      return next === null ? { refusal: 'no_vehicle' } : { refusal: 'no_vehicle', nextInGameMin: Math.min(2880, Math.round(next - now)) };
    }
    const vehicleKey = `${line.id}#${vehicle.serviceId}`;
    if ((this.passengers.get(vehicleKey) ?? 0) >= line.seats) return { refusal: 'full' };
    return { plan: { line, from, to, vehicleKey } };
  }

  private async board(sessionId: string, body: RideRequestMessage, plan: Plan): Promise<void> {
    const characterId = this.players.characterOf(sessionId);
    if (characterId === null) return this.reject(sessionId, body, { refusal: 'unavailable' });
    const { line } = plan;
    const fare = BigInt(line.fareDjai);
    const result = await this.deps.economy.commit({
      idempotencyKey: `fare:${characterId}:${body.requestId}`,
      kind: 'fare',
      legs: [
        { account: characterAccount(characterId), amount: -fare },
        { account: 'system:transport', amount: fare },
      ],
      reason: { requestId: body.requestId },
    });
    if (!result.ok) return this.reject(sessionId, body, { refusal: result.code === 'INSUFFICIENT_FUNDS' ? 'insufficient_funds' : 'unavailable' });
    const arriveInMs = this.tripMs(plan);
    const update: RideUpdateMessage = { requestId: body.requestId, lineId: line.id, toStopId: body.toStopId, state: 'boarded', fareDjai: line.fareDjai, arriveInMs, refusals: [] };
    const destination = (line.stops[plan.to] as TransitLine['stops'][number]).utm;
    this.rides.set(sessionId, { sessionId, vehicleKey: plan.vehicleKey, arriveAtMs: this.deps.realNow() + arriveInMs, destination, update });
    this.passengers.set(plan.vehicleKey, (this.passengers.get(plan.vehicleKey) ?? 0) + 1);
    this.remember(sessionId, update);
    await this.deps.refreshWallet(sessionId, result.txId);
    this.deps.send(sessionId, { type: 'rideUpdate', body: update });
  }

  /** A sixth of the real trip time at the live ratio, between 3 and 20 s. */
  private tripMs(plan: Plan): number {
    const { schedule } = plan.line;
    const gameMin = (schedule.arriveMin[plan.to] as number) - (schedule.departMin[plan.from] as number);
    const ratio = this.deps.clockRatio();
    const realMs = ratio > 0 ? (gameMin / ratio) * 60_000 : MAX_TRIP_MS * ACCELERATION;
    return Math.round(Math.min(MAX_TRIP_MS, Math.max(MIN_TRIP_MS, realMs / ACCELERATION)));
  }

  private end(ride: Ride): void {
    this.rides.delete(ride.sessionId);
    const left = (this.passengers.get(ride.vehicleKey) ?? 1) - 1;
    if (left > 0) this.passengers.set(ride.vehicleKey, left);
    else this.passengers.delete(ride.vehicleKey);
  }

  private remember(sessionId: string, update: RideUpdateMessage): void {
    this.done.set(`${sessionId}:${update.requestId}`, update);
    if (this.done.size > 10_000) this.done.delete(this.done.keys().next().value as string);
  }

  private reject(sessionId: string, body: RideRequestMessage, why: { refusal: RideRefusal; nextInGameMin?: number }): void {
    const refusal = why.nextInGameMin === undefined ? { code: why.refusal } : { code: why.refusal, nextInGameMin: why.nextInGameMin };
    this.deps.send(sessionId, { type: 'rideUpdate', body: { requestId: body.requestId, lineId: body.lineId, toStopId: body.toStopId, state: 'rejected', fareDjai: 0, arriveInMs: 0, refusals: [refusal] } });
  }
}
