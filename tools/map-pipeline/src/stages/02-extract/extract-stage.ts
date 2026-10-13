/**
 * Role: stage 02-extract: cuts the commune (+ margin) out of the national OSM snapshot and keeps only game-relevant features (osmium in Docker).
 * Owner: backend
 */

import { rm } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { type BboxLonLat, expandBbox } from '../../geometry/expand-bbox.ts';
import { extractBboxArgs, OSM_TAG_FILTERS, OSMIUM_IMAGE, tagsFilterArgs } from '../../osmium/osmium-commands.ts';
import { ensureOsmiumImage, type RunOsmium, runOsmium } from '../../osmium/run-osmium.ts';
import type { PipelineStage, StageContext } from '../../runner/stage-contract.ts';
import { loadSourcesLockSync } from '../../sources/sources-lock.ts';
import { snapshotPath } from '../01-acquire/acquire-stage.ts';

export const EXTRACT_STAGE_ID = '02-extract';
export const COMMUNE_PBF_FILE = 'commune.osm.pbf';
const UNFILTERED_PBF_FILE = 'commune-unfiltered.osm.pbf';

const snapshotFile = (ctx: StageContext): string => {
  if (ctx.config.source.kind !== 'osm-snapshot') throw new Error('02-extract needs an "osm-snapshot" source');
  return snapshotPath(ctx, loadSourcesLockSync(ctx.fromRepo(ctx.config.source.lockFile)).osm);
};

const extractBbox = (ctx: StageContext): BboxLonLat => {
  const { boundary, marginM } = ctx.config;
  if (boundary.osmRelationId !== null) {
    throw new Error('extraction by boundary relation arrives with spike SP2 (T-018); use provisionalBboxLonLat for now');
  }
  if (!boundary.provisionalBboxLonLat) throw new Error('missing boundary.provisionalBboxLonLat');
  return expandBbox(boundary.provisionalBboxLonLat, marginM);
};

export const createExtractStage = (osmium: RunOsmium = runOsmium, checkImage = ensureOsmiumImage): PipelineStage => ({
  id: EXTRACT_STAGE_ID,
  version: 1,
  outputs: [COMMUNE_PBF_FILE],
  inputFiles: (ctx) => [snapshotFile(ctx)],
  params: (ctx) => ({ bbox: extractBbox(ctx), filters: OSM_TAG_FILTERS, image: OSMIUM_IMAGE }),
  run: async (ctx, outDir) => {
    await checkImage();
    const snapshot = snapshotFile(ctx);
    const mounts = { inputDir: dirname(snapshot), outputDir: outDir };
    const bbox = extractBbox(ctx);
    ctx.logger.info({ bbox }, 'extracting commune from snapshot');
    await osmium(extractBboxArgs(`/in/${basename(snapshot)}`, `/out/${UNFILTERED_PBF_FILE}`, bbox), mounts);
    await osmium(tagsFilterArgs(`/out/${UNFILTERED_PBF_FILE}`, `/out/${COMMUNE_PBF_FILE}`), mounts);
    await rm(join(outDir, UNFILTERED_PBF_FILE), { force: true });
  },
});
