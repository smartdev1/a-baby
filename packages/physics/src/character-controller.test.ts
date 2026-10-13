/**
 * Role: tests the character controller: walking speed, wall blocking and sliding, kerb step-up, tall walls, jump and gravity, determinism, and 10 000 random moves in a dense random city.
 * Owner: backend
 */

import fc from 'fast-check';
import type { CollisionData, Prism } from '@skyline/tile-format';
import { describe, expect, it } from 'vitest';
import { stepCharacter } from './character-controller.ts';
import { CollisionWorld } from './collision-world.ts';
import { DEFAULT_CHARACTER, type CharacterState, type MoveInput } from './physics-types.ts';
import { pointInRing, pushCircleOut } from './polygon-math.ts';

const box = ([x, z, w, d]: readonly [number, number, number, number], topYM: number): Prism => ({
  baseYM: 0,
  topYM,
  ring: Float32Array.from([x, z, x + w, z, x + w, z + d, x, z + d]),
});
const worldOf = (prisms: Prism[]): CollisionWorld => {
  const data: CollisionData = { heightField: { resolution: 2, cellSizeM: 250, heightsM: new Float32Array(4) }, prisms };
  const world = new CollisionWorld();
  world.addTile(data, 0, 0);
  return world;
};
const standing = (x: number, z: number, y = 0): CharacterState => ({
  position: { x, y, z },
  velocity: { x: 0, y: 0, z: 0 },
  grounded: true,
});
const forward: MoveInput = { moveX: 0, moveZ: 1, yawRad: 0, run: false, jump: false };

const run = (world: CollisionWorld, state: CharacterState, input: MoveInput, ticks: number): CharacterState => {
  let s = state;
  for (let k = 0; k < ticks; k++) s = stepCharacter(world, s, input);
  return s;
};

describe('stepCharacter', () => {
  it('should walk north at walking speed on open ground', () => {
    const s = run(worldOf([]), standing(100, 100), forward, 20); // 1 s
    expect(s.position.z - 100).toBeCloseTo(DEFAULT_CHARACTER.walkSpeedMPerS, 5);
    expect(s.position.x).toBeCloseTo(100, 9);
    expect(s.grounded).toBe(true);
  });

  it('should stop in front of a building wall and keep the radius', () => {
    const s = run(worldOf([box([90, 105, 20, 10], 9)]), standing(100, 100), { ...forward, run: true }, 40);
    expect(s.position.z).toBeLessThanOrEqual(105 - DEFAULT_CHARACTER.radiusM + 1e-3);
    expect(s.position.z).toBeGreaterThan(104.5);
  });

  it('should slide along a wall when moving diagonally into it', () => {
    const s = run(worldOf([box([0, 105, 250, 10], 9)]), standing(100, 100), { ...forward, yawRad: Math.PI / 4 }, 40);
    expect(s.position.x).toBeGreaterThan(102); // kept moving east along the wall
    expect(s.position.z).toBeLessThan(105);
  });

  it('should step up onto a 20 cm kerb but not onto a 1 m wall', () => {
    const kerb = run(worldOf([box([90, 101, 20, 10], 0.2)]), standing(100, 100), forward, 20);
    expect(kerb.position.y).toBeCloseTo(0.2, 6);
    expect(kerb.position.z).toBeGreaterThan(101);
    const wall = run(worldOf([box([90, 101, 20, 10], 1)]), standing(100, 100), forward, 20);
    expect(wall.position.y).toBe(0);
    expect(wall.position.z).toBeLessThan(101);
  });

  it('should jump, fall back and land on the ground', () => {
    const world = worldOf([]);
    const up = stepCharacter(world, standing(10, 10), { ...forward, moveZ: 0, jump: true });
    expect(up.grounded).toBe(false);
    expect(up.position.y).toBeGreaterThan(0);
    const landed = run(world, up, { ...forward, moveZ: 0 }, 30);
    expect(landed.grounded).toBe(true);
    expect(landed.position.y).toBe(0);
  });

  it('should be deterministic', () => {
    const world = worldOf([box([90, 105, 20, 10], 9), box([95, 95, 3, 3], 0.3)]);
    const input = { moveX: 0.7, moveZ: 0.4, yawRad: 0.9, run: true, jump: false };
    expect(run(world, standing(100, 100), input, 100)).toEqual(run(world, standing(100, 100), input, 100));
  });

  it('should never end inside a tall building after 10 000 random moves in a dense city', () => {
    const buildings: Prism[] = [];
    for (let i = 0; i < 20; i++)
      for (let j = 0; j < 20; j++)
        if ((i * 7 + j * 3) % 4 !== 0)
          buildings.push(
            box([10 + i * 12, 10 + j * 12, 8 + ((i + j) % 3), 7 + ((i * j) % 3)], 3.5 + ((i + j) % 4) * 3),
          );
    const world = worldOf(buildings);
    const move = fc.record({
      moveX: fc.double({ min: -1, max: 1, noNaN: true }),
      moveZ: fc.double({ min: -1, max: 1, noNaN: true }),
      yawRad: fc.double({ min: 0, max: 6.28, noNaN: true }),
      run: fc.boolean(),
      jump: fc.boolean(),
    });
    let state = standing(5, 5);
    fc.assert(
      fc.property(move, (input) => {
        state = stepCharacter(world, state, input);
        const { x, y, z } = state.position;
        return buildings.every(
          (b) =>
            b.topYM <= y + DEFAULT_CHARACTER.stepUpM ||
            (!pointInRing(b.ring, x, z) && pushCircleOut(b.ring, x, z, DEFAULT_CHARACTER.radiusM - 0.01) === null),
        );
      }),
      { numRuns: 10_000 },
    );
  });
});
