/**
 * Role: stage 14-tile-cut: cuts buildings, roads and places into 250 m L0 tiles (tiles.ndjson, one tile per line, local metres).
 * Owner: backend
 */

import { join } from 'node:path';
import type { BuildingRecord, ClassifiedRecord } from '../../records/map-records.ts';
import { readNdjson, writeNdjson } from '../../records/ndjson-files.ts';
import type { PipelineStage } from '../../runner/stage-contract.ts';
import { TileCutter } from '../../tiling/tile-cutter.ts';
import { CLASSIFIED_FILE, CLASSIFY_STAGE_ID } from '../05-classify/classify-stage.ts';
import { BUILDINGS_FILE, HEIGHTS_STAGE_ID } from '../06-heights/heights-stage.ts';

export const TILE_CUT_STAGE_ID = '14-tile-cut';
export const TILES_FILE = 'tiles.ndjson';

export const tileCutStage: PipelineStage = {
  id: TILE_CUT_STAGE_ID,
  version: 1,
  outputs: [TILES_FILE],
  inputFiles: (ctx) => [
    ctx.outputOf(HEIGHTS_STAGE_ID, BUILDINGS_FILE),
    ctx.outputOf(CLASSIFY_STAGE_ID, CLASSIFIED_FILE),
  ],
  params: () => ({ tileSizeM: 250 }),
  run: async (ctx, outDir) => {
    const cutter = new TileCutter();
    for await (const b of readNdjson<BuildingRecord>(ctx.outputOf(HEIGHTS_STAGE_ID, BUILDINGS_FILE)))
      cutter.addBuilding(b);
    for await (const r of readNdjson<ClassifiedRecord>(ctx.outputOf(CLASSIFY_STAGE_ID, CLASSIFIED_FILE)))
      cutter.addClassified(r);
    const count = await writeNdjson(join(outDir, TILES_FILE), cutter.sortedTiles());
    ctx.logger.info({ tiles: count }, 'tiles cut');
  },
};
