/**
 * Role: condition registry of the engine: each condition checks one part of an action's requirements against the actor and place views and returns refusal reasons; the request is valid when no condition refuses.
 * Owner: backend
 */

import { type Action, NEEDS } from '@skyline/content-schema';
import { isOpenAt } from '@skyline/sim-clock';
import { type ActorView, cooldownKey, type PlaceView } from './actor-view.ts';

/** A refusal reason the client can show (code + parameters for the i18n message). */
export interface Refusal {
  readonly code: string;
  readonly params?: Readonly<Record<string, string | number>>;
}

export type Condition = (action: Action, actor: ActorView, place: PlaceView) => Refusal[];

const MINUTES_PER_DAY = 1440;

/** "HH:MM" (24:00 allowed as an end) → minutes since midnight. */
export const clockMinutes = (text: string): number => {
  const [h, m] = text.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

export const inWindows = (windows: readonly { readonly from: string; readonly to: string }[], gameMinute: number): boolean => {
  if (windows.length === 0) return true;
  const minuteOfDay = ((gameMinute % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return windows.some((w) => isOpenAt({ openMin: clockMinutes(w.from), closeMin: clockMinutes(w.to) }, minuteOfDay));
};

const placeCondition: Condition = (action, _actor, place) => {
  if (place.placeType === null || !action.where.placeTypes.includes(place.placeType)) return [{ code: 'wrong_place', params: { expected: action.where.placeTypes.join(',') } }];
  const out: Refusal[] = [];
  if (place.distanceToSiteM > action.where.interactionRadiusM) out.push({ code: 'too_far', params: { maxM: action.where.interactionRadiusM } });
  if (place.freeSites <= 0) out.push({ code: 'no_free_site', params: { site: action.where.site } });
  return out;
};

const timeCondition: Condition = (action, actor, place) => {
  const out: Refusal[] = [];
  if (action.when.openingHoursFrom === 'place' && !inWindows(place.openingHours, actor.gameMinute)) out.push({ code: 'place_closed' });
  if (!inWindows(action.when.windows, actor.gameMinute)) out.push({ code: 'outside_hours' });
  return out;
};

const needsCondition: Condition = (action, actor) =>
  NEEDS.flatMap((need): Refusal[] => {
    const bounds = action.requires.needs[need];
    if (!bounds) return [];
    const v = actor.needs[need];
    if (bounds.max !== undefined && v > bounds.max) return [{ code: 'need_too_high', params: { need, max: bounds.max } }];
    if (bounds.min !== undefined && v < bounds.min) return [{ code: 'need_too_low', params: { need, min: bounds.min } }];
    return [];
  });

const moneyCondition: Condition = (action, actor) => {
  const min = action.requires.money?.minDjai ?? 0;
  return actor.djai < min ? [{ code: 'not_enough_money', params: { minDjai: min } }] : [];
};

const stateCondition: Condition = (action, actor) => action.requires.state.filter((s) => !actor.states.has(s)).map((s) => ({ code: 'wrong_state', params: { state: s } }));

const cooldownCondition: Condition = (action, actor, place) => {
  const cd = action.requires.cooldown;
  if (!cd) return [];
  const until = actor.cooldowns.get(cooldownKey(action.id, cd.scope, place.placeId)) ?? -Infinity;
  return actor.gameMinute < until ? [{ code: 'cooldown', params: { gameMinutesLeft: Math.ceil(until - actor.gameMinute) } }] : [];
};

const nearbyCondition: Condition = (action, actor) => {
  const min = action.requires.nearbyCharacters?.min ?? 0;
  return actor.nearbyCharacters < min ? [{ code: 'not_enough_people', params: { min } }] : [];
};

/** Open registry: a new condition = one function added here. Order = order of the reasons shown. */
export const CONDITIONS: readonly Condition[] = [placeCondition, timeCondition, stateCondition, needsCondition, moneyCondition, cooldownCondition, nearbyCondition];

export const evaluateConditions = (action: Action, actor: ActorView, place: PlaceView, registry: readonly Condition[] = CONDITIONS): Refusal[] =>
  registry.flatMap((condition) => condition(action, actor, place));
