/**
 * Role: tests the parallel layer: ordered results with a bounded window, failures propagated, worker count from the environment, and pool output byte-identical to the inline path.
 * Owner: backend
 */

import { describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { L0TileSummary } from '../encoding/tile-writer.ts';
import type { TileContent } from '../tiling/tile-content.ts';
import { mapOrdered } from './ordered-map.ts';
import { createTileEncoderPool, pipelineWorkerCount } from './tile-encoder-pool.ts';

const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

const TILE: TileContent = {
  key: 'L0_325_199',
  buildingParts: [{ id: 'osm:way/1', baseYM: 2, heightM: 6.5, polygons: [[[[10, 10], [22, 10], [22, 18], [10, 18], [10, 10]]]] }],
  buildingMeta: [{ id: 'osm:way/1', type: 'house', levels: 2, heightM: 6.5, heightSource: 'heuristic' }],
  roads: [{ id: 'osm:way/2', roadClass: 'residential', lines: [[[0, 100], [250, 100]]] }],
  places: [],
  instances: [{ module: 11, position: [16, 10], yawRad: Math.PI, scale: 1, variant: 0x34, yM: 2, stretchX: 1.1, stretchY: 1 }],
  terrain: null,
};

describe('mapOrdered', () => {
  it('should consume results in input order while keeping at most N jobs in flight', async () => {
    let inFlight = 0;
    let peak = 0;
    const seen: number[] = [];
    await mapOrdered(
      [5, 1, 4, 2, 3, 0],
      async (n) => {
        peak = Math.max(peak, ++inFlight);
        await wait(n * 3);
        inFlight--;
        return n * 10;
      },
      (out) => {
        seen.push(out);
      },
      3,
    );
    expect(seen).toEqual([50, 10, 40, 20, 30, 0]);
    expect(peak).toBeLessThanOrEqual(3);
  });

  it('should reject with the first failure in order', async () => {
    const work = (n: number): Promise<number> => (n === 2 ? Promise.reject(new Error('tile 2 failed')) : Promise.resolve(n));
    await expect(mapOrdered([1, 2, 3], work, () => undefined, 2)).rejects.toThrow('tile 2 failed');
  });
});

describe('tile encoder pool', () => {
  it('should read the worker count from the environment (0 = inline)', () => {
    expect(pipelineWorkerCount({ SKYLINE_PIPELINE_WORKERS: '0' })).toBe(0);
    expect(pipelineWorkerCount({ SKYLINE_PIPELINE_WORKERS: '3' })).toBe(3);
    expect(pipelineWorkerCount({})).toBeGreaterThanOrEqual(1);
    expect(() => pipelineWorkerCount({ SKYLINE_PIPELINE_WORKERS: '-1' })).toThrow();
  });

  it('should produce the same bytes on worker threads as inline', async () => {
    const outDir = await mkdtemp(join(tmpdir(), 'skyline-pool-'));
    const context = { existing: [TILE.key], options: {}, outDir };
    const inline = createTileEncoderPool(context, 0);
    const pool = createTileEncoderPool(context, 2);
    try {
      const job = { kind: 'l0' as const, tileJson: JSON.stringify(TILE) };
      const [a, b] = (await Promise.all([inline.encode(job), pool.encode(job)])) as [L0TileSummary, L0TileSummary];
      expect(b).toEqual(a);
      expect(a.instances).toBeDefined();
    } finally {
      await pool.close();
      await rm(outDir, { recursive: true, force: true });
    }
  });
});
