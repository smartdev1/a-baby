/**
 * Role: stage 05-classify: adds building flag, game place category and road class to every normalized record (classified.ndjson).
 * Owner: backend
 */

import { join } from 'node:path';
import type { ClassifiedRecord, NormalizedRecord } from '../../records/map-records.ts';
import { readNdjson, writeNdjson } from '../../records/ndjson-files.ts';
import type { PipelineStage } from '../../runner/stage-contract.ts';
import { classifyRecord } from '../../taxonomy/classify-record.ts';
import { NORMALIZE_STAGE_ID, NORMALIZED_FILE } from '../04-normalize/normalize-stage.ts';

export const CLASSIFY_STAGE_ID = '05-classify';
export const CLASSIFIED_FILE = 'classified.ndjson';

async function* classifyAll(path: string): AsyncGenerator<ClassifiedRecord> {
  for await (const record of readNdjson<NormalizedRecord>(path)) yield classifyRecord(record);
}

export const classifyStage: PipelineStage = {
  id: CLASSIFY_STAGE_ID,
  // Bump when place-taxonomy.ts or classify-record.ts change their output.
  version: 1,
  outputs: [CLASSIFIED_FILE],
  inputFiles: (ctx) => [ctx.outputOf(NORMALIZE_STAGE_ID, NORMALIZED_FILE)],
  params: () => ({}),
  run: async (ctx, outDir) => {
    const count = await writeNdjson(
      join(outDir, CLASSIFIED_FILE),
      classifyAll(ctx.outputOf(NORMALIZE_STAGE_ID, NORMALIZED_FILE)),
    );
    ctx.logger.info({ count }, 'records classified');
  },
};
