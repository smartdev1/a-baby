/**
 * Role: stage 15-lod-build: L1 render tiles (500 m) built from the L0 tiles, streamed two rows at a time, written as tiles/L1/{i}_{j}/geom.<hash>.glb + lod-index.json.
 * Owner: backend
 */

import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parentTileKey, parseTileKey, type TileKey } from '@skyline/geo';
import { tileFilePath } from '@skyline/tile-format';
import { TILE_BUDGET_MAX } from '../../encoding/tile-budgets.ts';
import { encodeLodTile } from '../../encoding/tile-encoder.ts';
import { buildL1Tile } from '../../lod/build-l1-tile.ts';
import { readNdjson } from '../../records/ndjson-files.ts';
import type { PipelineStage } from '../../runner/stage-contract.ts';
import type { TileContent } from '../../tiling/tile-content.ts';
import { TILE_CUT_STAGE_ID, TILES_FILE } from '../14-tile-cut/tile-cut-stage.ts';

export const LOD_STAGE_ID = '15-lod-build';
export const LOD_INDEX_FILE = 'lod-index.json';

export interface LodIndexEntry {
  readonly geom: string;
  readonly bytes: number;
  readonly triangles: number;
}
export type LodIndex = Record<string, LodIndexEntry>;

export const lodStage: PipelineStage = {
  id: LOD_STAGE_ID,
  // Bump when lod/*.ts or the meshing change the L1 output.
  version: 1,
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
    const groups = new Map<string, Map<string, TileContent>>();
    const flush = async (keys: string[]): Promise<void> => {
      for (const key of keys) {
        const children = groups.get(key);
        groups.delete(key);
        if (!children) continue;
        const encoded = await encodeLodTile(buildL1Tile(key, children));
        if (encoded.geom.bytes.length > TILE_BUDGET_MAX.bytes || encoded.triangles > TILE_BUDGET_MAX.triangles) {
          throw new Error(`tile ${key} over budget: ${encoded.geom.bytes.length} bytes, ${encoded.triangles} triangles`);
        }
        const path = join(outDir, tileFilePath(key as TileKey, 'geom', encoded.geom.hash));
        await mkdir(join(path, '..'), { recursive: true });
        await writeFile(path, encoded.geom.bytes);
        index[key] = { geom: encoded.geom.hash, bytes: encoded.geom.bytes.length, triangles: encoded.triangles };
      }
    };
    // tiles.ndjson is sorted by row: an L1 row is complete once L0 rows 2J and 2J+1 have been read.
    for await (const tile of readNdjson<TileContent>(ctx.outputOf(TILE_CUT_STAGE_ID, TILES_FILE))) {
      const parent = parentTileKey(tile.key);
      if (!parent) continue;
      const rowJ = parseTileKey(tile.key).j;
      await flush([...groups.keys()].filter((k) => 2 * parseTileKey(k).j + 1 < rowJ));
      (groups.get(parent) ?? groups.set(parent, new Map()).get(parent))?.set(tile.key, tile);
    }
    await flush([...groups.keys()]);
    const sorted = Object.fromEntries(Object.entries(index).sort(([a], [b]) => (a < b ? -1 : 1)));
    await writeFile(join(outDir, LOD_INDEX_FILE), `${JSON.stringify(sorted, null, 2)}\n`);
    ctx.logger.info({ l1Tiles: Object.keys(sorted).length }, 'L1 tiles built');
  },
};
