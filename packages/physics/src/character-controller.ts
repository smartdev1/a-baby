/**
 * Role: deterministic fixed-step character controller: input → velocity, sub-stepped horizontal move with wall sliding and step-up, gravity, jump and grounding.
 * Owner: backend
 */

import type { CollisionWorld, WorldPrism } from './collision-world.ts';
import { DEFAULT_CHARACTER, FIXED_STEP_S, type CharacterConfig, type CharacterState, type MoveInput, type Vec3 } from './physics-types.ts';
import { pointInRing, pushCircleOut } from './polygon-math.ts';

const RESOLVE_ITERATIONS = 4;
/** Maximum ground slope that can be walked (45°). */
const MAX_SLOPE = 1;

/** What every step needs besides the state: the world and the tuning. */
export interface StepContext {
  readonly world: CollisionWorld;
  readonly cfg: CharacterConfig;
}

interface FlatPoint {
  readonly x: number;
  readonly z: number;
}

const horizontalVelocity = (input: MoveInput, cfg: CharacterConfig): FlatPoint => {
  let mx = input.moveX;
  let mz = input.moveZ;
  const len = Math.hypot(mx, mz);
  if (len > 1) {
    mx /= len;
    mz /= len;
  }
  const speed = input.run ? cfg.runSpeedMPerS : cfg.walkSpeedMPerS;
  const sin = Math.sin(input.yawRad);
  const cos = Math.cos(input.yawRad);
  // forward = (sin, cos) (yaw 0 = north), right = (cos, -sin)
  return { x: (cos * mx + sin * mz) * speed, z: (-sin * mx + cos * mz) * speed };
};

const blocks = (p: WorldPrism, feetY: number, cfg: CharacterConfig): boolean => p.topYM > feetY + cfg.stepUpM && p.baseYM < feetY + cfg.heightM;

/** Pushes the capsule out of every blocking prism; null when it cannot be freed (tight corner). */
const resolve = ({ world, cfg }: StepContext, at: FlatPoint, feetY: number): FlatPoint | null => {
  let { x, z } = at;
  for (let k = 0; k < RESOLVE_ITERATIONS; k++) {
    let moved = false;
    for (const prism of world.prismsNear(x, z, cfg.radiusM)) {
      if (!blocks(prism, feetY, cfg)) continue;
      const out = pushCircleOut(prism.ring, x, z, cfg.radiusM);
      if (out) {
        ({ x, z } = out);
        moved = true;
      }
    }
    if (!moved) return { x, z };
  }
  const stillInside = world.prismsNear(x, z, cfg.radiusM).some((p) => blocks(p, feetY, cfg) && pushCircleOut(p.ring, x, z, cfg.radiusM) !== null);
  return stillInside ? null : { x, z };
};

/** Highest walkable surface under the centre: ground or the top of a low prism (kerb, step, low roof). */
export const supportHeightAt = ({ world, cfg }: StepContext, at: FlatPoint, feetY: number): number => {
  let height = world.groundHeightAt(at.x, at.z);
  for (const p of world.prismsNear(at.x, at.z, 0)) {
    if (p.topYM <= feetY + cfg.stepUpM && p.topYM > height && pointInRing(p.ring, at.x, at.z)) height = p.topYM;
  }
  return height;
};

const moveHorizontally = (ctx: StepContext, start: Vec3, delta: FlatPoint): FlatPoint => {
  const steps = Math.max(1, Math.ceil(Math.hypot(delta.x, delta.z) / ctx.cfg.maxSubStepM));
  let current: FlatPoint = { x: start.x, z: start.z };
  for (let k = 0; k < steps; k++) {
    const next = resolve(ctx, { x: current.x + delta.x / steps, z: current.z + delta.z / steps }, start.y);
    if (!next) break;
    const rise = ctx.world.groundHeightAt(next.x, next.z) - ctx.world.groundHeightAt(current.x, current.z);
    if (rise > ctx.cfg.stepUpM + MAX_SLOPE * Math.hypot(next.x - current.x, next.z - current.z)) break; // too steep
    current = next;
  }
  return current;
};

export interface StepOptions {
  readonly cfg?: CharacterConfig;
  readonly dt?: number;
}

export const stepCharacter = (world: CollisionWorld, state: CharacterState, input: MoveInput, options: StepOptions = {}): CharacterState => {
  const ctx: StepContext = { world, cfg: options.cfg ?? DEFAULT_CHARACTER };
  const dt = options.dt ?? FIXED_STEP_S;
  const hv = horizontalVelocity(input, ctx.cfg);
  const moved = moveHorizontally(ctx, state.position, { x: hv.x * dt, z: hv.z * dt });

  let vy = state.velocity.y;
  if (state.grounded && input.jump) vy = ctx.cfg.jumpSpeedMPerS;
  else if (!state.grounded) vy -= ctx.cfg.gravityMPerS2 * dt;

  const support = supportHeightAt(ctx, moved, state.position.y);
  let y = state.position.y + vy * dt;
  let grounded = false;
  const snapsDown = state.grounded && vy <= 0 && state.position.y - support <= ctx.cfg.stepUpM;
  if (y <= support || snapsDown) {
    y = support;
    vy = 0;
    grounded = true;
  }

  return {
    position: { x: moved.x, y, z: moved.z },
    velocity: { x: (moved.x - state.position.x) / dt, y: vy, z: (moved.z - state.position.z) / dt },
    grounded,
  };
};
