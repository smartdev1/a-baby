/**
 * Role: timetable of one transit line (ARCHITECTURE §17.3): service profile of the mode (visible speed, dwell, headway per period of the game day) turned into a trip plan along the measured path, and the departures of any game-time interval with stable service ids.
 * Owner: backend
 */

import { measurePolyline, type MeasuredPolyline, projectForward } from './polyline-measure.ts';
import type { Point } from './road-graph.ts';

const MINUTES_PER_DAY = 1440;

/** Headway over a window of the game day; `toMin <= fromMin` crosses midnight. */
export interface ServicePeriod {
  readonly fromMin: number;
  readonly toMin: number;
  readonly headwayMin: number;
}

export interface ServiceProfile {
  /** Speed seen by players in real time; converted with the nominal clock ratio. */
  readonly cruiseKmh: number;
  readonly dwellGameMin: number;
  readonly periods: readonly ServicePeriod[];
}

export interface LineInput {
  readonly id: string;
  readonly path: readonly Point[];
  readonly stops: readonly { readonly id: string; readonly position: Point }[];
}

export interface LineSchedule {
  readonly lineId: string;
  readonly path: MeasuredPolyline;
  readonly stopIds: readonly string[];
  /** Distance of each stop along the path, non-decreasing. */
  readonly stopAtM: readonly number[];
  /** Game minutes after departure when the vehicle reaches / leaves each stop. */
  readonly arriveMin: readonly number[];
  readonly departMin: readonly number[];
  readonly tripMin: number;
  readonly speedMPerGameMin: number;
  readonly periods: readonly ServicePeriod[];
  /** Fraction of the headway that shifts this line's departures, so lines do not all leave together. */
  readonly phase: number;
}

/** A departure is when the vehicle appears at the first stop; it leaves it one dwell later. */
export interface Departure {
  /** `day.period.k`: the k-th departure of a period on a game day. */
  readonly serviceId: string;
  readonly departGameMin: number;
}

/** FNV-1a of the line id, as a fraction in [0, 1). */
const phaseOf = (lineId: string): number => {
  let h = 0x811c9dc5;
  for (let i = 0; i < lineId.length; i++) h = Math.imul(h ^ lineId.charCodeAt(i), 0x01000193) >>> 0;
  return h / 2 ** 32;
};

const tripPlan = (stopAtM: readonly number[], speed: number, dwell: number): { arriveMin: number[]; departMin: number[] } => {
  // Every stop has a dwell, terminuses included (boarding at the first one, alighting at the last one).
  const arriveMin = [0];
  const departMin = [dwell];
  for (let i = 1; i < stopAtM.length; i++) {
    const arrive = (departMin[i - 1] as number) + ((stopAtM[i] as number) - (stopAtM[i - 1] as number)) / speed;
    arriveMin.push(arrive);
    departMin.push(arrive + dwell);
  }
  return { arriveMin, departMin };
};

/** `nominalRatio`: game minutes per real minute of the configured clock (not the live segment, so a ratio change never moves vehicles). */
export const buildLineSchedule = (line: LineInput, profile: ServiceProfile, nominalRatio: number): LineSchedule => {
  if (line.stops.length < 2) throw new RangeError(`line ${line.id} needs at least 2 stops`);
  if (profile.periods.some((p) => p.headwayMin <= 0)) throw new RangeError('headways must be positive');
  const path = measurePolyline(line.path);
  const stopAtM: number[] = [];
  for (const stop of line.stops) stopAtM.push(projectForward(path, stop.position, stopAtM[stopAtM.length - 1] ?? 0));
  const speedMPerGameMin = (profile.cruiseKmh * 1000) / 60 / nominalRatio;
  const { arriveMin, departMin } = tripPlan(stopAtM, speedMPerGameMin, profile.dwellGameMin);
  return {
    lineId: line.id,
    path,
    stopIds: line.stops.map((s) => s.id),
    stopAtM,
    arriveMin,
    departMin,
    tripMin: departMin[departMin.length - 1] as number,
    speedMPerGameMin,
    periods: profile.periods,
    phase: phaseOf(line.id),
  };
};

/** Departures of one period on one game day falling in [fromMin, toMin]. */
const periodDepartures = (schedule: LineSchedule, day: number, index: number, range: readonly [number, number]): Departure[] => {
  const period = schedule.periods[index] as ServicePeriod;
  const start = day * MINUTES_PER_DAY + period.fromMin + schedule.phase * period.headwayMin;
  const end = day * MINUTES_PER_DAY + period.toMin + (period.toMin <= period.fromMin ? MINUTES_PER_DAY : 0);
  const out: Departure[] = [];
  const first = Math.max(0, Math.ceil((range[0] - start) / period.headwayMin));
  for (let k = first; ; k++) {
    const at = start + k * period.headwayMin;
    if (at >= end || at > range[1]) break;
    out.push({ serviceId: `${day}.${index}.${k}`, departGameMin: at });
  }
  return out;
};

/** All departures in [fromMin, toMin] of game time, sorted by time. */
export const departuresBetween = (schedule: LineSchedule, fromMin: number, toMin: number): Departure[] => {
  const out: Departure[] = [];
  // A period of the previous day may cross midnight into the range.
  for (let day = Math.floor(fromMin / MINUTES_PER_DAY) - 1; day <= Math.floor(toMin / MINUTES_PER_DAY); day++) {
    for (let i = 0; i < schedule.periods.length; i++) out.push(...periodDepartures(schedule, day, i, [fromMin, toMin]));
  }
  return out.sort((a, b) => a.departGameMin - b.departGameMin);
};
