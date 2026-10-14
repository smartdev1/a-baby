/**
 * Role: ellipse of long actions (ARCHITECTURE §16.1): real duration of an action from its game duration and the clock ratio, capped by `duration.real.maxSeconds`; progress and continuous effects follow the share of real time elapsed, so the full game effects apply.
 * Owner: backend
 */

import type { Action, NeedId } from '@skyline/content-schema';

/** Real milliseconds the actor is busy (paused world: the cap). */
export const realDurationMs = (action: Action, ratio: number): number => {
  const capMs = action.duration.real.maxSeconds * 1000;
  if (ratio <= 0) return capMs;
  return Math.min(capMs, (action.duration.gameMinutes * 60_000) / ratio);
};

/** Progress 0–1 after `elapsedRealMs`. */
export const progressAt = (action: Action, ratio: number, elapsedRealMs: number): number => {
  const total = realDurationMs(action, ratio);
  return total <= 0 ? 1 : Math.min(1, Math.max(0, elapsedRealMs / total));
};

/** Continuous need deltas between two progress values (e.g. energy while sleeping), over the action's full game duration. */
export const continuousDeltas = (action: Action, fromProgress: number, toProgress: number): Partial<Record<NeedId, number>> => {
  const gameHours = (action.duration.gameMinutes / 60) * Math.max(0, toProgress - fromProgress);
  const out: Partial<Record<NeedId, number>> = {};
  for (const c of action.effects.continuous) out[c.need] = (out[c.need] ?? 0) + c.deltaPerGameHour * gameHours;
  return out;
};
