/**
 * Role: builds the ride service of a cell from its daily life (economy, game clock, wallet) and its cluster (reachable stops), and puts arriving riders back in the street at their stop, on the ground of the cell frame.
 * Owner: backend
 */

import { cellKeyOf, isInsideGrid, type UtmPosition } from '@skyline/geo';
import type { CharacterState, CollisionWorld } from '@skyline/physics';
import type { ServerMessage } from '@skyline/protocol';
import type { DailyLife, DailyLifeDeps } from '../actions/daily-life.ts';
import { RideService } from './ride-service.ts';
import type { TransitNetwork } from './transit-network.ts';

export interface CellRidesSources {
  readonly network: TransitNetwork;
  readonly daily: DailyLife;
  readonly dailyDeps: Omit<DailyLifeDeps, 'send'>;
  readonly cluster: ReadonlySet<string>;
  readonly frameOrigin: UtmPosition;
  readonly send: (sessionId: string, message: ServerMessage) => void;
  readonly positionOf: (sessionId: string) => { readonly x: number; readonly z: number } | null;
}

export const createCellRides = (s: CellRidesSources): RideService =>
  new RideService(
    {
      network: s.network,
      economy: s.dailyDeps.economy,
      gameMinute: s.dailyDeps.gameMinute,
      clockRatio: s.dailyDeps.clockRatio,
      realNow: s.dailyDeps.realNow ?? Date.now,
      reachable: (utm) => isInsideGrid(utm) && s.cluster.has(cellKeyOf(utm)),
      send: s.send,
      refreshWallet: (sessionId, txId) => s.daily.refreshWallet(sessionId, txId),
    },
    {
      characterOf: (sessionId) => s.daily.characterOf(sessionId),
      utmOf: (sessionId) => {
        const p = s.positionOf(sessionId);
        return p ? { eastingM: s.frameOrigin.eastingM + p.x, northingM: s.frameOrigin.northingM + p.z } : null;
      },
    },
  );

/** Standing still on the ground at the stop (frame metres; the stop may lie past the border, the handoff follows). */
export const stateAtStop = (world: CollisionWorld, frameOrigin: UtmPosition, stop: UtmPosition): CharacterState => {
  const x = stop.eastingM - frameOrigin.eastingM;
  const z = stop.northingM - frameOrigin.northingM;
  return { position: { x, y: world.groundHeightAt(x, z), z }, velocity: { x: 0, y: 0, z: 0 }, grounded: true };
};
