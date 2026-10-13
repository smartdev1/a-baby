/**
 * Role: stage 16-encode: writes every tile as tiles/L0/{i}_{j}/<kind>.<hash>.<ext> plus encode-index.json (hashes, sizes, triangles); fails when a tile is over budget.
 * Owner: backend
 */

import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tileFilePath } from '@skyline/tile-format';
import { budgetViolations, tileBytes } from '../../encoding/tile-budgets.ts';
import { type EncodedTile, encodeTile } from '../../encoding/tile-encoder.ts';
import { readNdjson } from '../../records/ndjson-files.ts';
import type { PipelineStage } from '../../runner/stage-contract.ts';
import type { TileContent } from '../../tiling/tile-content.ts';
import { TILE_CUT_STAGE_ID, TILES_FILE } from '../14-tile-cut/tile-cut-stage.ts';

export const ENCODE_STAGE_ID = '16-encode';
export const ENCODE_INDEX_FILE = 'encode-index.json';

export interface EncodeIndexEntry {
  readonly geom: string;
  readonly collision: string;
  readonly meta: string;
  readonly bytes: number;
  readonly triangles: number;
}
export type EncodeIndex = Record<string, EncodeIndexEntry>;

const writeTile = async (outDir: string, t: EncodedTile): Promise<void> => {
  const key = t.key as Parameters<typeof tileFilePath>[0];
  for (const kind of ['geom', 'collision', 'meta'] as const) {
    const path = join(outDir, tileFilePath(key, kind, t[kind].hash));
    await mkdir(join(path, '..'), { recursive: true });
    await writeFile(path, t[kind].bytes);
  }
};

const indexPaths = (index: EncodeIndex): string[] =>
  Object.entries(index).flatMap(([key, e]) =>
    (['geom', 'collision', 'meta'] as const).map((kind) => tileFilePath(key as Parameters<typeof tileFilePath>[0], kind, e[kind])),
  );

export const encodeStage: PipelineStage = {
  id: ENCODE_STAGE_ID,
  // v3: displayed place names in meta (09-naming).
  version: 3,
  outputs: [ENCODE_INDEX_FILE],
  inputFiles: (ctx) => [ctx.outputOf(TILE_CUT_STAGE_ID, TILES_FILE)],
  params: () => ({ formatVersion: 0 }),
  extraOutputsPresent: async (outDir) => {
    const index = JSON.parse(await readFile(join(outDir, ENCODE_INDEX_FILE), 'utf8')) as EncodeIndex;
    return indexPaths(index).every((p) => existsSync(join(outDir, p)));
  },
  run: async (ctx, outDir) => {
    const tilesPath = ctx.outputOf(TILE_CUT_STAGE_ID, TILES_FILE);
    const existing = new Set<string>();
    for await (const t of readNdjson<TileContent>(tilesPath)) existing.add(t.key);

    await rm(join(outDir, 'tiles'), { recursive: true, force: true });
    const index: EncodeIndex = {};
    const violations: string[] = [];
    for await (const tile of readNdjson<TileContent>(tilesPath)) {
      const encoded = await encodeTile(tile, existing);
      violations.push(...budgetViolations(encoded));
      await writeTile(outDir, encoded);
      index[tile.key] = { geom: encoded.geom.hash, collision: encoded.collision.hash, meta: encoded.meta.hash, bytes: tileBytes(encoded), triangles: encoded.triangles };
    }
    if (violations.length > 0) throw new Error(`${violations.length} tile(s) over budget:\n${violations.join('\n')}`);
    await writeFile(join(outDir, ENCODE_INDEX_FILE), `${JSON.stringify(index, null, 2)}\n`);
    ctx.logger.info({ tiles: Object.keys(index).length }, 'tiles encoded');
  },
};
