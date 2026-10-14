/**
 * Role: what the needs mean for play: penalties of empty needs (slow walk, work refused…), warnings below the configured level, and the derived morale (never stored).
 * Owner: backend
 */

import { NEEDS, type NeedId, type NeedPenalty, type NeedsConfig } from '@skyline/content-schema';
import type { NeedValues } from './needs-state.ts';

/** Penalties of every need at 0, sorted and without duplicates. */
export const needPenalties = (values: NeedValues, config: NeedsConfig): NeedPenalty[] =>
  [...new Set(NEEDS.filter((n) => values[n] <= 0).flatMap((n) => config.needs[n]?.penaltiesAtZero ?? []))].sort();

export const needWarnings = (values: NeedValues, config: NeedsConfig): NeedId[] => NEEDS.filter((n) => values[n] < (config.needs[n]?.warnBelow ?? 0));

/** Morale 0–100: mean of the needs, pulled down by the lowest one (a single empty need hurts). */
export const morale = (values: NeedValues): number => {
  const all = NEEDS.map((n) => values[n]);
  const mean = all.reduce((s, v) => s + v, 0) / all.length;
  return Math.round(0.6 * mean + 0.4 * Math.min(...all));
};

/** Game hours until a need reaches 0 at its decay rate (Infinity when it does not decay). */
export const hoursUntilEmpty = (values: NeedValues, need: NeedId, config: NeedsConfig): number => {
  const rate = config.needs[need]?.decayPerGameHour ?? 0;
  return rate === 0 ? Number.POSITIVE_INFINITY : values[need] / rate;
};
