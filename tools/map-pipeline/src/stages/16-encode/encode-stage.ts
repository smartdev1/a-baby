/**
 * Role: stage 16-encode: encodes every tile on the worker pool and writes tiles/L0/{i}_{j}/<kind>.<hash>.<ext> in input order plus encode-index.json (hashes, sizes, triangles); fails when a tile is over budget.
 * Owner: backend
 */

import { existsSync } from 'node:fs';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { TILE_FORMAT_VERSION, tileFilePath } from '@skyline/tile-format';
import type { EncodeJobResult } from '../../parallel/encode-jobs.ts';
import { mapOrdered } from '../../parallel/ordered-map.ts';
import { createTileEncoderPool, inFlightFor } from '../../parallel/tile-encoder-pool.ts';
import { readNdjsonLines } from '../../records/ndjson-files.ts';
import type { PipelineStage } from '../../runner/stage-contract.ts';
import { tileKeyOfLine } from '../../tiling/tile-content.ts';
import { TILE_CUT_STAGE_ID, TILES_FILE } from '../14-tile-cut/tile-cut-stage.ts';

export const ENCODE_STAGE_ID = '16-encode';
export const ENCODE_INDEX_FILE = 'encode-index.json';

export interface EncodeIndexEntry {
  readonly geom: string;
  readonly collision: string;
  readonly meta: string;
  readonly instances?: string;
  readonly bytes: number;
  readonly triangles: number;
}
export type EncodeIndex = Record<string, EncodeIndexEntry>;

const indexPaths = (index: EncodeIndex): string[] =>
  Object.entries(index).flatMap(([key, e]) =>
    (['geom', 'collision', 'meta', 'instances'] as const).flatMap((kind) => {
      const hash = e[kind];
      return hash ? [tileFilePath(key as Parameters<typeof tileFilePath>[0], kind, hash)] : [];
    }),
  );

export const encodeStage: PipelineStage = {
  id: ENCODE_STAGE_ID,
  // v9: facade instances (absolute height, stretch; instances.bin v2), sheet-metal roofs, instance draw calls in the budget (T-102).
  version: 9,
  outputs: [ENCODE_INDEX_FILE],
  inputFiles: (ctx) => [ctx.outputOf(TILE_CUT_STAGE_ID, TILES_FILE)],
  params: (ctx) => ({ formatVersion: TILE_FORMAT_VERSION, stripFacadeWalls: ctx.config.facades.stripBayWalls }),
  extraOutputsPresent: async (outDir) => {
    const index = JSON.parse(await readFile(join(outDir, ENCODE_INDEX_FILE), 'utf8')) as EncodeIndex;
    return indexPaths(index).every((p) => existsSync(join(outDir, p)));
  },
  run: async (ctx, outDir) => {
    const tilesPath = ctx.outputOf(TILE_CUT_STAGE_ID, TILES_FILE);
    const existing = new Set<string>();
    for await (const line of readNdjsonLines(tilesPath)) existing.add(tileKeyOfLine(line));

    await rm(join(outDir, 'tiles'), { recursive: true, force: true });
    const index: EncodeIndex = {};
    const violations: string[] = [];
    const pool = createTileEncoderPool({ existing: [...existing], options: { stripFacadeWalls: ctx.config.facades.stripBayWalls }, outDir });
    const consume = (t: EncodeJobResult): void => {
      if (t.kind !== 'l0') return;
      violations.push(...t.violations);
      index[t.key] = { geom: t.geom, collision: t.collision, meta: t.meta, ...(t.instances ? { instances: t.instances } : {}), bytes: t.bytes, triangles: t.triangles };
    };
    try {
      const jobs = async function* (): AsyncGenerator<{ kind: 'l0'; tileJson: string }> {
        for await (const tileJson of readNdjsonLines(tilesPath)) yield { kind: 'l0', tileJson };
      };
      await mapOrdered(jobs(), (job) => pool.encode(job), consume, inFlightFor(pool));
    } finally {
      await pool.close();
    }
    if (violations.length > 0) throw new Error(`${violations.length} tile(s) over budget:\n${violations.join('\n')}`);
    await writeFile(join(outDir, ENCODE_INDEX_FILE), `${JSON.stringify(index, null, 2)}\n`);
    ctx.logger.info({ tiles: Object.keys(index).length }, 'tiles encoded');
  },
};
