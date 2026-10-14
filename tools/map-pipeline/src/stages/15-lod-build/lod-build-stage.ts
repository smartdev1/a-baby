/**
 * Role: stage 15-lod-build: render-only tiles L1 (500 m), L2 (1 km) and L3 (2 km) built from the L0 tiles, streamed by bands of rows and encoded on the worker pool, written as tiles/L{n}/{i}_{j}/geom.<hash>.glb + lod-index.json.
 * Owner: backend
 */

import { existsSync } from 'node:fs';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { formatTileKey, parseTileKey, type TileKey, type TileLevel } from '@skyline/geo';
import { tileFilePath } from '@skyline/tile-format';
import { TILE_BUDGET_MAX } from '../../encoding/tile-budgets.ts';
import type { EncodeJob, EncodeJobResult } from '../../parallel/encode-jobs.ts';
import { mapOrdered } from '../../parallel/ordered-map.ts';
import { createTileEncoderPool, inFlightFor } from '../../parallel/tile-encoder-pool.ts';
import { readNdjsonLines } from '../../records/ndjson-files.ts';
import type { PipelineStage } from '../../runner/stage-contract.ts';
import { tileKeyOfLine } from '../../tiling/tile-content.ts';
import { TILE_CUT_STAGE_ID, TILES_FILE } from '../14-tile-cut/tile-cut-stage.ts';

export const LOD_STAGE_ID = '15-lod-build';
export const LOD_INDEX_FILE = 'lod-index.json';

export interface LodIndexEntry {
  readonly geom: string;
  readonly bytes: number;
  readonly triangles: number;
}
export type LodIndex = Record<string, LodIndexEntry>;

/** Render-only levels built from the L0 tiles. */
const LOD_LEVELS = [1, 2, 3] as const;

const ancestorKey = (key: string, level: number): string => {
  const { i, j } = parseTileKey(key);
  return formatTileKey({ level: level as TileLevel, i: Math.floor(i / 2 ** level), j: Math.floor(j / 2 ** level) });
};

/**
 * Jobs of one level in row order. tiles.ndjson is sorted by row: a tile of level n is complete once the L0 rows
 * up to (J + 1) · 2ⁿ − 1 have been read, so only a band of rows is held in memory.
 */
async function* lodJobs(tilesPath: string, level: (typeof LOD_LEVELS)[number]): AsyncGenerator<EncodeJob> {
  const groups = new Map<string, Map<string, string>>();
  const take = function* (keys: string[]): Generator<EncodeJob> {
    for (const key of keys) {
      const children = groups.get(key);
      groups.delete(key);
      if (!children) continue;
      yield level === 1 ? { kind: 'l1', key, children: [...children.entries()] } : { kind: 'coarse', level, key, children: [...children.entries()] };
    }
  };
  for await (const line of readNdjsonLines(tilesPath)) {
    const key = tileKeyOfLine(line);
    const ancestor = ancestorKey(key, level);
    const rowJ = parseTileKey(key).j;
    yield* take([...groups.keys()].filter((k) => (parseTileKey(k).j + 1) * 2 ** level <= rowJ));
    (groups.get(ancestor) ?? groups.set(ancestor, new Map()).get(ancestor))?.set(key, line);
  }
  yield* take([...groups.keys()]);
}

export const lodStage: PipelineStage = {
  id: LOD_STAGE_ID,
  // Bump when lod/*.ts or the meshing change the output. v2: sheet-metal roofs (T-102). v3: L2/L3 with block impostors (T-202).
  version: 3,
  outputs: [LOD_INDEX_FILE],
  inputFiles: (ctx) => [ctx.outputOf(TILE_CUT_STAGE_ID, TILES_FILE)],
  params: () => ({ levels: LOD_LEVELS }),
  extraOutputsPresent: async (outDir) => {
    const index = JSON.parse(await readFile(join(outDir, LOD_INDEX_FILE), 'utf8')) as LodIndex;
    return Object.entries(index).every(([key, e]) => existsSync(join(outDir, tileFilePath(key as TileKey, 'geom', e.geom))));
  },
  run: async (ctx, outDir) => {
    await rm(join(outDir, 'tiles'), { recursive: true, force: true });
    const index: LodIndex = {};
    const pool = createTileEncoderPool({ existing: [], options: {}, outDir });
    const record = (t: EncodeJobResult): void => {
      if (t.bytes > TILE_BUDGET_MAX.bytes || t.triangles > TILE_BUDGET_MAX.triangles) throw new Error(`tile ${t.key} over budget: ${t.bytes} bytes, ${t.triangles} triangles`);
      index[t.key] = { geom: t.geom, bytes: t.bytes, triangles: t.triangles };
    };
    try {
      for (const level of LOD_LEVELS) await mapOrdered(lodJobs(ctx.outputOf(TILE_CUT_STAGE_ID, TILES_FILE), level), (job) => pool.encode(job), record, inFlightFor(pool));
    } finally {
      await pool.close();
    }
    const sorted = Object.fromEntries(Object.entries(index).sort(([a], [b]) => (a < b ? -1 : 1)));
    await writeFile(join(outDir, LOD_INDEX_FILE), `${JSON.stringify(sorted, null, 2)}\n`);
    ctx.logger.info({ tiles: Object.keys(sorted).length, byLevel: Object.fromEntries(LOD_LEVELS.map((l) => [`L${l}`, Object.keys(sorted).filter((k) => k.startsWith(`L${l}_`)).length])) }, 'LOD tiles built');
  },
};
