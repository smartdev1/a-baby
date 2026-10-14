/**
 * Role: needs of a character as a pure snapshot (values 0–100, game minute of the last update): start values, linear decay per game hour while connected, deltas from actions, frozen while offline.
 * Owner: backend
 */

import { NEEDS, type NeedId, type NeedsConfig } from '@skyline/content-schema';

export type NeedValues = Readonly<Record<NeedId, number>>;

export interface NeedsSnapshot {
  readonly values: NeedValues;
  /** Game minute the values are valid for. */
  readonly atGameMinute: number;
}

const clamp = (v: number): number => Math.min(100, Math.max(0, v));
/** Values are kept to 1/100 so every machine computes the same numbers. */
const round = (v: number): number => Math.round(v * 100) / 100;

const mapNeeds = (f: (need: NeedId) => number): NeedValues => Object.fromEntries(NEEDS.map((n) => [n, round(clamp(f(n)))])) as Record<NeedId, number>;

export const initialNeeds = (config: NeedsConfig, gameMinute: number): NeedsSnapshot => ({
  values: mapNeeds((n) => config.needs[n]?.start ?? 100),
  atGameMinute: gameMinute,
});

/** Decay from the snapshot time to `gameMinute` (connected time only). Never goes back in time. */
export const advanceNeeds = (s: NeedsSnapshot, gameMinute: number, config: NeedsConfig): NeedsSnapshot => {
  const hours = Math.max(0, gameMinute - s.atGameMinute) / 60;
  return { values: mapNeeds((n) => s.values[n] - (config.needs[n]?.decayPerGameHour ?? 0) * hours), atGameMinute: Math.max(gameMinute, s.atGameMinute) };
};

/**
 * Offline freeze: on reconnection the snapshot is moved to the current game minute without any decay
 * (ARCHITECTURE §16.1: no player comes back starving).
 */
export const resumeNeeds = (s: NeedsSnapshot, gameMinute: number): NeedsSnapshot => ({ values: s.values, atGameMinute: Math.max(gameMinute, s.atGameMinute) });

export const applyNeedDeltas = (s: NeedsSnapshot, deltas: Partial<Record<NeedId, number>>): NeedsSnapshot => ({
  values: mapNeeds((n) => s.values[n] + (deltas[n] ?? 0)),
  atGameMinute: s.atGameMinute,
});
