/**
 * Role: types and default tuning of the shared character controller (metres, seconds, frame x = east, y = up, z = north).
 * Owner: backend
 */

export interface Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface CharacterState {
  /** Feet position. */
  readonly position: Vec3;
  readonly velocity: Vec3;
  readonly grounded: boolean;
}

/** Same meaning as the protocol `input` message: an intention, never a position. */
export interface MoveInput {
  /** Strafe −1…1 and forward −1…1, relative to `yawRad` (0 = facing north, positive turns towards east). */
  readonly moveX: number;
  readonly moveZ: number;
  readonly yawRad: number;
  readonly run: boolean;
  readonly jump: boolean;
}

export interface CharacterConfig {
  readonly radiusM: number;
  readonly heightM: number;
  readonly walkSpeedMPerS: number;
  readonly runSpeedMPerS: number;
  readonly jumpSpeedMPerS: number;
  readonly gravityMPerS2: number;
  /** Highest obstacle climbed without jumping (kerb, step). */
  readonly stepUpM: number;
  /** Longest horizontal move per sub-step: thinner than any wall so nothing is tunnelled. */
  readonly maxSubStepM: number;
}

export const DEFAULT_CHARACTER: CharacterConfig = {
  radiusM: 0.3,
  heightM: 1.75,
  walkSpeedMPerS: 1.6,
  runSpeedMPerS: 4.5,
  jumpSpeedMPerS: 4.2,
  gravityMPerS2: 9.81,
  stepUpM: 0.35,
  maxSubStepM: 0.15,
};

/** Fixed simulation step shared by client prediction and the 20 Hz zone tick. */
export const FIXED_STEP_S = 0.05;
