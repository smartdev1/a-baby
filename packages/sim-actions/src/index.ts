/**
 * Role: public API of @skyline/sim-actions. Data-driven action engine (ADR 0004): condition and effect registries, action state machine, ellipse of long actions, deterministic outcomes and idempotent settlement.
 * Owner: backend
 */

export { cooldownKey, type ActorState, type ActorView, type PlaceView } from './actor-view.ts';
export { CONDITIONS, clockMinutes, evaluateConditions, inWindows, type Condition, type Refusal } from './action-conditions.ts';
export { applyEffects, EFFECT_HANDLERS, emptyBatch, type EconomyLeg, type EffectBatch, type EffectContext } from './action-effects.ts';
export { continuousDeltas, progressAt, realDurationMs } from './action-ellipse.ts';
export { drawWeighted, unitHash } from './outcome-draw.ts';
export { failRun, IllegalTransitionError, interruptRun, markSettled, requestRun, reserveRun, startRun, tickRun, timeoutRun, type ActionRun, type RunState } from './action-run.ts';
export { settle, SettlementStore, settlementKey, type Settlement, type SettleInput } from './action-settlement.ts';
