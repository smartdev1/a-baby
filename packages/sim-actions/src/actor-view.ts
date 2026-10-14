/**
 * Role: what the engine reads about the actor and the place when it evaluates an action (authoritative state assembled by the zone server; read-only for the engine).
 * Owner: backend
 */

import type { NeedValues } from '@skyline/sim-needs';

export type ActorState = 'on_foot' | 'not_in_action' | 'in_vehicle' | 'at_home' | 'on_shift';

export interface ActorView {
  readonly characterId: string;
  readonly needs: NeedValues;
  readonly djai: number;
  readonly states: ReadonlySet<ActorState>;
  /** Absolute game minute (sim-clock). */
  readonly gameMinute: number;
  /** Cooldown end (absolute game minute) by key `action id` (character scope) or `action id@place id` (place scope). */
  readonly cooldowns: ReadonlyMap<string, number>;
  /** Other characters within the social radius. */
  readonly nearbyCharacters: number;
}

export interface PlaceView {
  readonly placeId: string;
  /** Place type id from content/place-types; null for a generic spot. */
  readonly placeType: string | null;
  /** Opening hours of the place type (game-time windows), empty = always open. */
  readonly openingHours: readonly { readonly from: string; readonly to: string }[];
  /** Distance from the actor to the nearest free site of the right kind. */
  readonly distanceToSiteM: number;
  /** Free capacity of that site kind. */
  readonly freeSites: number;
  /** NPC roles working at the place right now (vendor, waiter…); absent = not checked. */
  readonly npcRolesOnDuty?: readonly string[];
}

/** Key of a cooldown entry. */
export const cooldownKey = (actionId: string, scope: 'character' | 'place', placeId: string): string => (scope === 'character' ? actionId : `${actionId}@${placeId}`);
