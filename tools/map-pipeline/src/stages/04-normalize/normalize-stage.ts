/**
 * Role: stage 04-normalize: streams features.geojsonseq into normalized.ndjson (stable ids, UTM metres, parsed numeric tags), in input order.
 * Owner: backend
 */

import { join } from 'node:path';
import { readNdjson, writeNdjson } from '../../records/ndjson-files.ts';
import type { NormalizedRecord } from '../../records/map-records.ts';
import type { PipelineStage } from '../../runner/stage-contract.ts';
import { EXPORT_STAGE_ID, FEATURES_FILE } from '../03-export/export-stage.ts';
import { type ExportedFeature, normalizeFeature } from './normalize-feature.ts';

export const NORMALIZE_STAGE_ID = '04-normalize';
export const NORMALIZED_FILE = 'normalized.ndjson';

async function* normalizeAll(path: string, dropped: { count: number }): AsyncGenerator<NormalizedRecord> {
  for await (const feature of readNdjson<ExportedFeature>(path)) {
    const record = normalizeFeature(feature);
    if (record) yield record;
    else dropped.count++;
  }
}

export const normalizeStage: PipelineStage = {
  id: NORMALIZE_STAGE_ID,
  version: 1,
  outputs: [NORMALIZED_FILE],
  inputFiles: (ctx) => [ctx.outputOf(EXPORT_STAGE_ID, FEATURES_FILE)],
  params: () => ({}),
  run: async (ctx, outDir) => {
    const dropped = { count: 0 };
    const kept = await writeNdjson(
      join(outDir, NORMALIZED_FILE),
      normalizeAll(ctx.outputOf(EXPORT_STAGE_ID, FEATURES_FILE), dropped),
    );
    ctx.logger.info({ kept, dropped: dropped.count }, 'features normalized');
  },
};
