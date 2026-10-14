/**
 * Role: public API of @skyline/sim-needs. Needs simulation (hunger, energy, hygiene, social, fun): decay over game time while connected, frozen offline, action deltas, penalties and derived morale.
 * Owner: backend
 */

export { advanceNeeds, applyNeedDeltas, initialNeeds, resumeNeeds, type NeedValues, type NeedsSnapshot } from './needs-state.ts';
export { hoursUntilEmpty, morale, needPenalties, needWarnings } from './needs-effects.ts';
