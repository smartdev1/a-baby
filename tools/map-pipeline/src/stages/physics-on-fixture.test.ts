/**
 * Role: integration test pipeline → physics: the character controller walks 10 000 random steps through the real collision tiles of the Pigeons fixture (Yopougon) without ever ending inside a building.
 * Owner: backend
 */

import { readdirSync, readFileSync } from 'node:fs';
import { copyFile, cp, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import fc from 'fast-check';
import { tileBounds } from '@skyline/geo';
import {
  CollisionWorld,
  DEFAULT_CHARACTER,
  pointInRing,
  pushCircleOut,
  stepCharacter,
  type CharacterState,
} from '@skyline/physics';
import { decodeCollision } from '@skyline/tile-format';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createLogger } from '@skyline/observability';
import { loadPipelineConfig } from '../config/load-pipeline-config.ts';
import { runPipeline } from '../runner/run-pipeline.ts';
import { stagesFor } from './stage-registry.ts';

const packageDir = fileURLToPath(new URL('../../', import.meta.url));
const FIXTURE = 'tools/map-pipeline/test/fixtures/pigeons-sample.geojson';
let root = '';
let world = new CollisionWorld();

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), 'physics-fixture-'));
  await mkdir(join(root, dirname(FIXTURE)), { recursive: true });
  await copyFile(join(packageDir, 'test/fixtures/pigeons-sample.geojson'), join(root, FIXTURE));
  await cp(join(packageDir, '../../content/place-names'), join(root, 'content/place-names'), { recursive: true });
  const config = await loadPipelineConfig(join(packageDir, 'config/fixture.pipeline.json'));
  await runPipeline({
    repoRoot: root,
    config,
    stages: stagesFor(config),
    logger: createLogger({ service: 'test', level: 'silent' }),
  });

  const tilesDir = join(root, config.outputDir, 'stages/16-encode/tiles/L0');
  const keys = readdirSync(tilesDir).map((d) => `L0_${d}`);
  const origin = tileBounds(keys[0] ?? '');
  world = new CollisionWorld();
  for (const key of keys) {
    const dir = join(tilesDir, key.slice(3));
    const file = readdirSync(dir).find((f) => f.startsWith('collision.'));
    const b = tileBounds(key);
    world.addTile(
      decodeCollision(new Uint8Array(readFileSync(join(dir, file ?? '')))),
      b.minEastingM - origin.minEastingM,
      b.minNorthingM - origin.minNorthingM,
    );
  }
}, 60_000);
afterAll(async () => rm(root, { recursive: true, force: true }));

const startNextToBuildings = (): { x: number; z: number } => {
  for (let x = 0; x < 1000; x += 5) {
    for (let z = 0; z < 1000; z += 5) {
      const near = world.prismsNear(x, z, 3);
      const free = world.prismsNear(x, z, DEFAULT_CHARACTER.radiusM + 0.5).length === 0;
      if (near.length >= 3 && free) return { x, z };
    }
  }
  throw new Error('no free start point next to buildings');
};

describe('physics on real Yopougon tiles (Pigeons fixture)', () => {
  it('should never end inside a building over 10 000 random steps', () => {
    // Start 1.5 m south-west of the first building of the densest tile, in a street.
    const start = startNextToBuildings();
    let state: CharacterState = {
      position: { x: start.x, y: 0, z: start.z },
      velocity: { x: 0, y: 0, z: 0 },
      grounded: true,
    };
    const move = fc.record({
      moveX: fc.double({ min: -1, max: 1, noNaN: true }),
      moveZ: fc.double({ min: -1, max: 1, noNaN: true }),
      yawRad: fc.double({ min: 0, max: 6.28, noNaN: true }),
      run: fc.boolean(),
      jump: fc.boolean(),
    });
    const r = DEFAULT_CHARACTER.radiusM - 0.01;
    let checkedPrisms = 0;
    fc.assert(
      fc.property(move, (input) => {
        state = stepCharacter(world, state, input);
        const { x, y, z } = state.position;
        const near = world.prismsNear(x, z, 1);
        checkedPrisms += near.length;
        return near.every(
          (p) =>
            p.topYM <= y + DEFAULT_CHARACTER.stepUpM ||
            (!pointInRing(p.ring, x, z) && pushCircleOut(p.ring, x, z, r) === null),
        );
      }),
      { numRuns: 10_000, seed: 2026 },
    );
    expect(checkedPrisms).toBeGreaterThan(0); // the walk really met buildings
  });
});
