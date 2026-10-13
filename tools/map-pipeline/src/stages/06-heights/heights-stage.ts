/**
 * Role: stage 06-heights: keeps building records and gives each one levels, height in metres and the source of that height (buildings.ndjson).
 * Owner: backend
 */

import { join } from 'node:path';
import { rngFor } from '../../determinism/seeded-rng.ts';
import { multiPolygonAreaM2 } from '../../geometry/utm-polygon-area.ts';
import { resolveHeight } from '../../heuristics/height-heuristics.ts';
import type { BuildingRecord, ClassifiedRecord } from '../../records/map-records.ts';
import { readNdjson, writeNdjson } from '../../records/ndjson-files.ts';
import type { PipelineStage } from '../../runner/stage-contract.ts';
import { CLASSIFIED_FILE, CLASSIFY_STAGE_ID } from '../05-classify/classify-stage.ts';

export const HEIGHTS_STAGE_ID = '06-heights';
export const BUILDINGS_FILE = 'buildings.ndjson';

const toBuilding = (record: ClassifiedRecord, seed: string): BuildingRecord | null => {
  if (!record.isBuilding || record.geometry.type !== 'MultiPolygon') return null;
  const footprintAreaM2 = Math.round(multiPolygonAreaM2(record.geometry.coordinates) * 100) / 100;
  const type = record.tags['building'] ?? 'yes';
  const height = resolveHeight(
    {
      type,
      footprintAreaM2,
      ...(record.levels === undefined ? {} : { osmLevels: record.levels }),
      ...(record.heightM === undefined ? {} : { osmHeightM: record.heightM }),
    },
    rngFor(seed, record.id),
  );
  return { id: record.id, type, ...height, footprintAreaM2, footprint: record.geometry, placeCategory: record.placeCategory };
};

async function* buildingsOf(path: string, seed: string): AsyncGenerator<BuildingRecord> {
  for await (const record of readNdjson<ClassifiedRecord>(path)) {
    const building = toBuilding(record, seed);
    if (building) yield building;
  }
}

export const heightsStage: PipelineStage = {
  id: HEIGHTS_STAGE_ID,
  // Bump when height-heuristics.ts changes its output.
  version: 1,
  outputs: [BUILDINGS_FILE],
  inputFiles: (ctx) => [ctx.outputOf(CLASSIFY_STAGE_ID, CLASSIFIED_FILE)],
  params: (ctx) => ({ seed: ctx.config.seed }),
  run: async (ctx, outDir) => {
    const count = await writeNdjson(join(outDir, BUILDINGS_FILE), buildingsOf(ctx.outputOf(CLASSIFY_STAGE_ID, CLASSIFIED_FILE), ctx.config.seed));
    ctx.logger.info({ count }, 'building heights resolved');
  },
};
