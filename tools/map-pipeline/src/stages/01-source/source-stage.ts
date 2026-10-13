/**
 * Role: stage 01-source: brings the configured source into the build (copy of a local GeoJSON + source descriptor with its sha256).
 * Owner: backend
 */

import { copyFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { sha256OfFile } from '../../runner/content-hash.ts';
import type { PipelineStage, StageContext } from '../../runner/stage-contract.ts';

export const SOURCE_STAGE_ID = '01-source';
export const SOURCE_DATA_FILE = 'source.geojson';
export const SOURCE_DESCRIPTOR_FILE = 'source.json';

const localSourcePath = (ctx: StageContext): string => {
  const { source } = ctx.config;
  if (source.kind !== 'local-file') {
    throw new Error(`source kind "${source.kind}" is not supported yet: OSM snapshot acquisition arrives with T-022`);
  }
  return ctx.fromRepo(source.path);
};

export const sourceStage: PipelineStage = {
  id: SOURCE_STAGE_ID,
  version: 1,
  outputs: [SOURCE_DATA_FILE, SOURCE_DESCRIPTOR_FILE],
  inputFiles: (ctx) => [localSourcePath(ctx)],
  params: (ctx) => ctx.config.source,
  run: async (ctx, outDir) => {
    const input = localSourcePath(ctx);
    await copyFile(input, join(outDir, SOURCE_DATA_FILE));
    const descriptor = {
      kind: ctx.config.source.kind,
      format: 'geojson',
      sha256: await sha256OfFile(input),
      licence: 'ODbL-1.0',
      attribution: '© OpenStreetMap contributors',
    };
    await writeFile(join(outDir, SOURCE_DESCRIPTOR_FILE), `${JSON.stringify(descriptor, null, 2)}\n`);
  },
};
