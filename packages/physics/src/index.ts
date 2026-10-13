/**
 * Role: public API of @skyline/physics. Deterministic 2.5D character controller and collision queries shared by client prediction and server.
 * Owner: backend
 */

export { DEFAULT_CHARACTER, FIXED_STEP_S, type CharacterConfig, type CharacterState, type MoveInput, type Vec3 } from './physics-types.ts';
export { CollisionWorld, type WorldPrism } from './collision-world.ts';
export { stepCharacter, supportHeightAt, type StepContext, type StepOptions } from './character-controller.ts';
export { closestOnRing, pointInRing, pushCircleOut } from './polygon-math.ts';
