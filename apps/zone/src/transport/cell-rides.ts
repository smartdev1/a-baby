/**
 * Role: builds the ride and taxi services of a cell from its daily life (economy, game clock, wallet) and its cluster (reachable stops and places), and puts arriving passengers back in the street, on the ground of the cell frame.
 * Owner: backend
 */

import { cellKeyOf, isInsideGrid, type UtmPosition } from '@skyline/geo';
import type { CharacterState, CollisionWorld } from '@skyline/physics';
import type { RideRequestMessage, ServerMessage, TaxiRequestMessage } from '@skyline/protocol';
import type { DailyLife, DailyLifeDeps } from '../actions/daily-life.ts';
import type { TaxiFare } from '@skyline/content-schema';
import type { CityMap } from './city-map.ts';
import { type RideDeps, type RidePlayers, RideService } from './ride-service.ts';
import { TaxiService } from './taxi-service.ts';
import type { TransitNetwork } from './transit-network.ts';

export interface CellRidesSources {
  readonly network: TransitNetwork;
  readonly city?: CityMap;
  readonly taxiFare?: TaxiFare;
  readonly daily: DailyLife;
  readonly dailyDeps: Omit<DailyLifeDeps, 'send'>;
  readonly cluster: ReadonlySet<string>;
  readonly frameOrigin: UtmPosition;
  readonly send: (sessionId: string, message: ServerMessage) => void;
  readonly positionOf: (sessionId: string) => { readonly x: number; readonly z: number } | null;
}

const playersOf = (s: CellRidesSources): RidePlayers => ({
  characterOf: (sessionId) => s.daily.characterOf(sessionId),
  utmOf: (sessionId) => {
    const p = s.positionOf(sessionId);
    return p ? { eastingM: s.frameOrigin.eastingM + p.x, northingM: s.frameOrigin.northingM + p.z } : null;
  },
});

/** Line rides, and metered taxis when the city map and the fare are given; each refuses a player busy with the other. */
export const createCellTransport = (s: CellRidesSources): CellTransport => {
  const common: Omit<RideDeps, 'network'> = {
    economy: s.dailyDeps.economy,
    gameMinute: s.dailyDeps.gameMinute,
    clockRatio: s.dailyDeps.clockRatio,
    realNow: s.dailyDeps.realNow ?? Date.now,
    reachable: (utm) => isInsideGrid(utm) && s.cluster.has(cellKeyOf(utm)),
    send: s.send,
    refreshWallet: (sessionId, txId) => s.daily.refreshWallet(sessionId, txId),
  };
  const players = playersOf(s);
  let taxis: TaxiService | null = null;
  const rides = new RideService({ ...common, network: s.network, busyElsewhere: (id) => taxis?.hasJob(id) ?? false }, players);
  if (s.city && s.taxiFare) taxis = new TaxiService({ ...common, map: s.city, fare: s.taxiFare, busyElsewhere: (id) => rides.isRiding(id) }, players);
  return new CellTransport(rides, taxis, s.send);
};

/** What the cell needs from transport: requests, who is inside a vehicle, who arrives. */
export class CellTransport {
  constructor(
    private readonly rides: RideService,
    private readonly taxis: TaxiService | null,
    private readonly send: (sessionId: string, message: ServerMessage) => void,
  ) {}

  handle(sessionId: string, message: { type: 'rideRequest'; body: RideRequestMessage } | { type: 'taxiRequest'; body: TaxiRequestMessage }): Promise<void> {
    if (message.type === 'rideRequest') return this.rides.request(sessionId, message.body);
    if (this.taxis) return this.taxis.request(sessionId, message.body);
    const { requestId, destinationPlaceId } = message.body;
    this.send(sessionId, { type: 'taxiUpdate', body: { requestId, destinationPlaceId, state: 'rejected', etaMs: 0, fareDjai: 0, distanceM: 0, refusals: [{ code: 'unavailable' }] } });
    return Promise.resolve();
  }

  isAboard(sessionId: string): boolean {
    return this.rides.isRiding(sessionId) || (this.taxis?.isAboard(sessionId) ?? false);
  }

  arrivals(): { sessionId: string; destination: UtmPosition }[] {
    return [...this.rides.arrivals(), ...(this.taxis?.step() ?? [])];
  }

  remove(sessionId: string): void {
    this.rides.remove(sessionId);
    this.taxis?.remove(sessionId);
  }
}

/** Standing still on the ground at the stop (frame metres; the stop may lie past the border, the handoff follows). */
export const stateAtStop = (world: CollisionWorld, frameOrigin: UtmPosition, stop: UtmPosition): CharacterState => {
  const x = stop.eastingM - frameOrigin.eastingM;
  const z = stop.northingM - frameOrigin.northingM;
  return { position: { x, y: world.groundHeightAt(x, z), z }, velocity: { x: 0, y: 0, z: 0 }, grounded: true };
};
