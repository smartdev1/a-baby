/**
 * Role: stage 02-extract: exports the commune boundary, cuts the commune (+ margin) out of the national snapshot and keeps game-relevant features (osmium in Docker).
 * Owner: backend
 */

import { readFile, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { type BboxLonLat, expandBbox } from '../../geometry/expand-bbox.ts';
import { bboxOf, type Geometry } from '../../geometry/geojson-geometry.ts';
import {
  exportPolygonsArgs,
  extractBboxArgs,
  getRelationArgs,
  OSM_TAG_FILTERS,
  OSMIUM_IMAGE,
  tagsFilterArgs,
} from '../../osmium/osmium-commands.ts';
import { ensureOsmiumImage, type OsmiumMounts, type RunOsmium, runOsmium } from '../../osmium/run-osmium.ts';
import type { PipelineStage, StageContext } from '../../runner/stage-contract.ts';
import { loadSourcesLockSync } from '../../sources/sources-lock.ts';
import { snapshotPath } from '../01-acquire/acquire-stage.ts';

export const EXTRACT_STAGE_ID = '02-extract';
export const COMMUNE_PBF_FILE = 'commune.osm.pbf';
/** Boundary polygon(s) of the commune; an empty FeatureCollection when only a provisional bbox is known. */
export const BOUNDARY_FILE = 'boundary.geojson';
const UNFILTERED_PBF_FILE = 'commune-unfiltered.osm.pbf';
const BOUNDARY_PBF_FILE = 'boundary.osm.pbf';

const snapshotFile = (ctx: StageContext): string => {
  if (ctx.config.source.kind !== 'osm-snapshot') throw new Error('02-extract needs an "osm-snapshot" source');
  return snapshotPath(ctx, loadSourcesLockSync(ctx.fromRepo(ctx.config.source.lockFile)).osm);
};

/** Writes boundary.geojson and returns the commune bbox (from the relation, or the provisional bbox). */
const resolveBoundary = async (
  ctx: StageContext,
  osmium: RunOsmium,
  mounts: OsmiumMounts,
  snapshot: string,
): Promise<BboxLonLat> => {
  const { osmRelationId, provisionalBboxLonLat } = ctx.config.boundary;
  const boundaryPath = join(mounts.outputDir, BOUNDARY_FILE);
  if (osmRelationId === null) {
    if (!provisionalBboxLonLat) throw new Error('missing boundary.osmRelationId or boundary.provisionalBboxLonLat');
    await writeFile(boundaryPath, '{"type":"FeatureCollection","features":[]}\n');
    return provisionalBboxLonLat;
  }
  await osmium(getRelationArgs(`/in/${basename(snapshot)}`, `/out/${BOUNDARY_PBF_FILE}`, osmRelationId), mounts);
  await osmium(exportPolygonsArgs(`/out/${BOUNDARY_PBF_FILE}`, `/out/${BOUNDARY_FILE}`), mounts);
  await rm(join(mounts.outputDir, BOUNDARY_PBF_FILE), { force: true });
  const { features } = JSON.parse(await readFile(boundaryPath, 'utf8')) as { features: { geometry: Geometry }[] };
  const boundary = features[0];
  if (!boundary) throw new Error(`OSM relation ${osmRelationId} has no closed polygon in the snapshot`);
  return bboxOf(boundary.geometry);
};

export const createExtractStage = (osmium: RunOsmium = runOsmium, checkImage = ensureOsmiumImage): PipelineStage => ({
  id: EXTRACT_STAGE_ID,
  version: 2,
  outputs: [COMMUNE_PBF_FILE, BOUNDARY_FILE],
  inputFiles: (ctx) => [snapshotFile(ctx)],
  params: (ctx) => ({
    boundary: ctx.config.boundary,
    marginM: ctx.config.marginM,
    filters: OSM_TAG_FILTERS,
    image: OSMIUM_IMAGE,
  }),
  run: async (ctx, outDir) => {
    await checkImage();
    const snapshot = snapshotFile(ctx);
    const mounts = { inputDir: dirname(snapshot), outputDir: outDir };
    const bbox = expandBbox(await resolveBoundary(ctx, osmium, mounts, snapshot), ctx.config.marginM);
    ctx.logger.info({ bbox }, 'extracting commune from snapshot');
    await osmium(extractBboxArgs(`/in/${basename(snapshot)}`, `/out/${UNFILTERED_PBF_FILE}`, bbox), mounts);
    await osmium(tagsFilterArgs(`/out/${UNFILTERED_PBF_FILE}`, `/out/${COMMUNE_PBF_FILE}`), mounts);
    await rm(join(outDir, UNFILTERED_PBF_FILE), { force: true });
  },
});
