/**
 * Role: derives the replicated posture code of a character (idle, walk, run, airborne) from its authoritative state.
 * Owner: backend
 */

import type { CharacterState } from '@skyline/physics';

export const ENTITY_STATE = { idle: 0, walk: 1, run: 2, airborne: 3 } as const;

export const entityStateCode = (state: CharacterState): number => {
  if (!state.grounded) return ENTITY_STATE.airborne;
  const speed = Math.hypot(state.velocity.x, state.velocity.z);
  if (speed > 2.5) return ENTITY_STATE.run;
  return speed > 0.1 ? ENTITY_STATE.walk : ENTITY_STATE.idle;
};
