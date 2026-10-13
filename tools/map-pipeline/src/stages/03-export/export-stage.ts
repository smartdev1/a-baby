/**
 * Role: stage 03-export: produces `features.geojsonseq` (one feature per line), the common input of every later stage, from either the osmium extract or the local fixture.
 * Owner: backend
 */

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { exportGeojsonSeqArgs, OSMIUM_IMAGE } from '../../osmium/osmium-commands.ts';
import { ensureOsmiumImage, type RunOsmium, runOsmium } from '../../osmium/run-osmium.ts';
import type { PipelineStage, StageContext } from '../../runner/stage-contract.ts';
import { SOURCE_DATA_FILE, SOURCE_STAGE_ID } from '../01-source/source-stage.ts';
import { COMMUNE_PBF_FILE, EXTRACT_STAGE_ID } from '../02-extract/extract-stage.ts';
import { featureCollectionToSeq } from './geojson-to-seq.ts';

export const EXPORT_STAGE_ID = '03-export';
export const FEATURES_FILE = 'features.geojsonseq';

const inputFile = (ctx: StageContext): string =>
  ctx.config.source.kind === 'osm-snapshot'
    ? ctx.outputOf(EXTRACT_STAGE_ID, COMMUNE_PBF_FILE)
    : ctx.outputOf(SOURCE_STAGE_ID, SOURCE_DATA_FILE);

export const createExportStage = (osmium: RunOsmium = runOsmium, checkImage = ensureOsmiumImage): PipelineStage => ({
  id: EXPORT_STAGE_ID,
  version: 1,
  outputs: [FEATURES_FILE],
  inputFiles: (ctx) => [inputFile(ctx)],
  params: (ctx) => ({
    sourceKind: ctx.config.source.kind,
    image: ctx.config.source.kind === 'osm-snapshot' ? OSMIUM_IMAGE : null,
  }),
  run: async (ctx, outDir) => {
    const input = inputFile(ctx);
    if (ctx.config.source.kind === 'osm-snapshot') {
      await checkImage();
      await osmium(exportGeojsonSeqArgs(`/in/${COMMUNE_PBF_FILE}`, `/out/${FEATURES_FILE}`), {
        inputDir: dirname(input),
        outputDir: outDir,
      });
      return;
    }
    await writeFile(join(outDir, FEATURES_FILE), featureCollectionToSeq(await readFile(input, 'utf8')));
  },
});
