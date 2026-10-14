/**
 * Role: deterministic line vehicles (ARCHITECTURE §17.3): position = f(line, service, game time), the same on client and server; vehicles running at a time, the vehicle docked at a stop (boarding) and the next arrival at a stop.
 * Owner: backend
 */

import { pointAlong, type PointAlong } from './polyline-measure.ts';
import { departuresBetween, type LineSchedule } from './line-schedule.ts';

export interface LineVehicle extends PointAlong {
  readonly lineId: string;
  readonly serviceId: string;
  readonly departGameMin: number;
  readonly distanceM: number;
  /** Stop index while the vehicle dwells there, else null. */
  readonly dockedAt: number | null;
  /** Index of the next stop ahead (the docked one while dwelling). */
  readonly nextStop: number;
}

/** Last stop index whose departure offset is ≤ `elapsed` (binary search). */
const legOf = (schedule: LineSchedule, elapsed: number): number => {
  let lo = 0;
  let hi = schedule.departMin.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if ((schedule.departMin[mid] as number) <= elapsed) lo = mid;
    else hi = mid - 1;
  }
  return lo;
};

/** Stop where the vehicle dwells: before leaving `leg`, after reaching the next stop, or at the end of the trip. */
const dockedIndex = (schedule: LineSchedule, leg: number, elapsed: number): number | null => {
  const last = schedule.stopAtM.length - 1;
  if (elapsed < (schedule.departMin[leg] as number)) return leg;
  if (leg < last && elapsed >= (schedule.arriveMin[leg + 1] as number)) return leg + 1;
  return elapsed >= schedule.tripMin ? last : null;
};

/** Where the vehicle of a departure is `elapsed` game minutes after it left, or null outside the trip. */
const vehicleAfter = (schedule: LineSchedule, serviceId: string, departGameMin: number, elapsed: number): LineVehicle | null => {
  if (elapsed < 0 || elapsed > schedule.tripMin) return null;
  const last = schedule.stopAtM.length - 1;
  let leg = legOf(schedule, elapsed);
  const docked = dockedIndex(schedule, leg, elapsed);
  if (docked !== null) leg = docked;
  const distanceM =
    docked !== null
      ? (schedule.stopAtM[docked] as number)
      : (schedule.stopAtM[leg] as number) + (elapsed - (schedule.departMin[leg] as number)) * schedule.speedMPerGameMin;
  return {
    ...pointAlong(schedule.path, distanceM),
    lineId: schedule.lineId,
    serviceId,
    departGameMin,
    distanceM,
    dockedAt: docked,
    nextStop: docked ?? Math.min(leg + 1, last),
  };
};

/** Every vehicle of the line on the road at `gameMin`. */
export const vehiclesAt = (schedule: LineSchedule, gameMin: number): LineVehicle[] =>
  departuresBetween(schedule, gameMin - schedule.tripMin, gameMin).flatMap(
    (d) => vehicleAfter(schedule, d.serviceId, d.departGameMin, gameMin - d.departGameMin) ?? [],
  );

/** The vehicle dwelling at `stopIndex` at `gameMin` (boarding is only accepted then), or null. */
export const dockedVehicleAt = (schedule: LineSchedule, stopIndex: number, gameMin: number): LineVehicle | null => {
  const arrive = schedule.arriveMin[stopIndex];
  const depart = schedule.departMin[stopIndex];
  if (arrive === undefined || depart === undefined) return null;
  const candidates = departuresBetween(schedule, gameMin - depart, gameMin - arrive);
  for (const d of candidates) {
    const v = vehicleAfter(schedule, d.serviceId, d.departGameMin, gameMin - d.departGameMin);
    if (v?.dockedAt === stopIndex) return v;
  }
  return null;
};

/** Game time of the next arrival at `stopIndex` at or after `gameMin`, looking up to two game days ahead. */
export const nextArrivalAt = (schedule: LineSchedule, stopIndex: number, gameMin: number): number | null => {
  const arrive = schedule.arriveMin[stopIndex];
  if (arrive === undefined) return null;
  const next = departuresBetween(schedule, gameMin - arrive, gameMin - arrive + 2 * 1440)[0];
  return next ? next.departGameMin + arrive : null;
};
