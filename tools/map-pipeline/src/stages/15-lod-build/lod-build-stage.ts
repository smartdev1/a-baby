/**
 * Role: stage 15-lod-build: L1 render tiles (500 m) built from the L0 tiles, streamed two rows at a time and encoded on the worker pool, written as tiles/L1/{i}_{j}/geom.<hash>.glb + lod-index.json.
 * Owner: backend
 */

import { existsSync } from 'node:fs';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parentTileKey, parseTileKey, type TileKey } from '@skyline/geo';
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

/** L1 jobs in row order. tiles.ndjson is sorted by row: an L1 row is complete once L0 rows 2J and 2J+1 have been read. */
async function* l1Jobs(tilesPath: string): AsyncGenerator<EncodeJob> {
  const groups = new Map<string, Map<string, string>>();
  const take = function* (keys: string[]): Generator<EncodeJob> {
    for (const key of keys) {
      const children = groups.get(key);
      groups.delete(key);
      if (children) yield { kind: 'l1', key, children: [...children.entries()] };
    }
  };
  for await (const line of readNdjsonLines(tilesPath)) {
    const key = tileKeyOfLine(line);
    const parent = parentTileKey(key);
    if (!parent) continue;
    const rowJ = parseTileKey(key).j;
    yield* take([...groups.keys()].filter((k) => 2 * parseTileKey(k).j + 1 < rowJ));
    (groups.get(parent) ?? groups.set(parent, new Map()).get(parent))?.set(key, line);
  }
  yield* take([...groups.keys()]);
}

export const lodStage: PipelineStage = {
  id: LOD_STAGE_ID,
  // Bump when lod/*.ts or the meshing change the L1 output. v2: sheet-metal roofs (T-102).
  version: 2,
  outputs: [LOD_INDEX_FILE],
  inputFiles: (ctx) => [ctx.outputOf(TILE_CUT_STAGE_ID, TILES_FILE)],
  params: () => ({ levels: [1] }),
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
      await mapOrdered(l1Jobs(ctx.outputOf(TILE_CUT_STAGE_ID, TILES_FILE)), (job) => pool.encode(job), record, inFlightFor(pool));
    } finally {
      await pool.close();
    }
    const sorted = Object.fromEntries(Object.entries(index).sort(([a], [b]) => (a < b ? -1 : 1)));
    await writeFile(join(outDir, LOD_INDEX_FILE), `${JSON.stringify(sorted, null, 2)}\n`);
    ctx.logger.info({ l1Tiles: Object.keys(sorted).length }, 'L1 tiles built');
  },
};
