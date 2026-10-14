/**
 * Role: stage 18-report: measures the OSM coverage of the commune (buildings, heights, roads, POIs, bus routes, density per tile) and the generated world (tiles per level, budgets, content), and writes JSON, Markdown and an SVG map.
 * Owner: backend
 */

import { readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fromUtm30n } from '@skyline/geo';
import { areaM2, bboxOf, type Geometry } from '../../geometry/geojson-geometry.ts';
import { busRoutesFilterArgs, OSMIUM_IMAGE } from '../../osmium/osmium-commands.ts';
import { ensureOsmiumImage, type RunOsmium, runOsmium } from '../../osmium/run-osmium.ts';
import type { PipelineStage, StageContext } from '../../runner/stage-contract.ts';
import { loadSourcesLockSync } from '../../sources/sources-lock.ts';
import { BOUNDARY_FILE, COMMUNE_PBF_FILE, EXTRACT_STAGE_ID } from '../02-extract/extract-stage.ts';
import { EXPORT_STAGE_ID, FEATURES_FILE } from '../03-export/export-stage.ts';
import { ROAD_STATS_FILE, ROADS_STAGE_ID } from '../08-roads/roads-stage.ts';
import { parseRouteRelations, type RouteRelation } from './bus-routes.ts';
import { addFeature, emptyStats } from './coverage-stats.ts';
import { classifyGapTiles } from './gap-tiles.ts';
import { GapCover } from './gap-cover.ts';
import { boundaryUtmBounds, renderDensitySvg, utmToLonLatFactory } from './density-svg.ts';
import { readFeatures } from './feature-stream.ts';
import { renderReportMarkdown } from './report-markdown.ts';
import type { RoadGraphStats } from '../../roads/road-graph-types.ts';
import { renderWorldReport } from '../../world-stats/world-report-markdown.ts';
import { type ContentReports, type IndexEntry, worldStats } from '../../world-stats/world-stats.ts';
import { NAMING_STAGE_ID } from '../09-naming/naming-stage.ts';
import { FACADES_STAGE_ID } from '../11-facades-roofs/facades-roofs-stage.ts';
import { PROPS_STAGE_ID } from '../12-props/props-stage.ts';
import { LOD_INDEX_FILE, LOD_STAGE_ID } from '../15-lod-build/lod-build-stage.ts';
import { ENCODE_INDEX_FILE, ENCODE_STAGE_ID } from '../16-encode/encode-stage.ts';

export const REPORT_STAGE_ID = '18-report';
const OUTPUTS = ['coverage-report.json', 'coverage-report.md', 'building-density.svg', 'world-report.json', 'world-report.md'] as const;

/** Generated-world inputs: tile indexes and the content reports of the stages. */
const WORLD_INPUTS = {
  encode: [ENCODE_STAGE_ID, ENCODE_INDEX_FILE],
  lod: [LOD_STAGE_ID, LOD_INDEX_FILE],
  props: [PROPS_STAGE_ID, 'props-report.json'],
  facades: [FACADES_STAGE_ID, 'facades-report.json'],
  naming: [NAMING_STAGE_ID, 'naming-report.json'],
} as const;

const readJson = async <T>(path: string): Promise<T> => JSON.parse(await readFile(path, 'utf8')) as T;

const writeWorldReport = async (ctx: StageContext, outDir: string): Promise<void> => {
  const at = (k: keyof typeof WORLD_INPUTS): string => ctx.outputOf(WORLD_INPUTS[k][0], WORLD_INPUTS[k][1]);
  const facades = await readJson<ContentReports['facades'] & { byModule: Record<string, number> }>(at('facades'));
  const stats = worldStats(
    { ...(await readJson<Record<string, IndexEntry>>(at('encode'))), ...(await readJson<Record<string, IndexEntry>>(at('lod'))) },
    { props: await readJson<ContentReports['props']>(at('props')), facades, naming: await readJson<ContentReports['naming']>(at('naming')), facadeModules: facades?.byModule ?? {} },
  );
  await writeFile(join(outDir, 'world-report.json'), `${JSON.stringify(stats, null, 2)}\n`);
  await writeFile(join(outDir, 'world-report.md'), renderWorldReport(ctx.config.displayName, stats));
};

const isSnapshot = (ctx: StageContext): boolean => ctx.config.source.kind === 'osm-snapshot';

const loadBoundary = async (ctx: StageContext): Promise<Geometry | null> => {
  if (!isSnapshot(ctx)) return null;
  const { features } = JSON.parse(await readFile(ctx.outputOf(EXTRACT_STAGE_ID, BOUNDARY_FILE), 'utf8')) as {
    features: { geometry: Geometry }[];
  };
  return features[0]?.geometry ?? null;
};

const loadBusRoutes = async (ctx: StageContext, osmium: RunOsmium, outDir: string): Promise<RouteRelation[] | null> => {
  if (!isSnapshot(ctx)) return null;
  const opl = join(outDir, 'bus-routes.opl');
  const inputDir = join(ctx.outputOf(EXTRACT_STAGE_ID, COMMUNE_PBF_FILE), '..');
  await osmium(busRoutesFilterArgs(`/in/${COMMUNE_PBF_FILE}`, '/out/bus-routes.opl'), { inputDir, outputDir: outDir });
  const routes = parseRouteRelations(await readFile(opl, 'utf8'));
  await rm(opl, { force: true });
  return routes;
};

const snapshotLabel = (ctx: StageContext): string =>
  ctx.config.source.kind === 'osm-snapshot'
    ? (({ osm }) => `Geofabrik ${osm.fileName} (${osm.snapshotDate})`)(
        loadSourcesLockSync(ctx.fromRepo(ctx.config.source.lockFile)),
      )
    : `local fixture ${ctx.config.source.path}`;

export const createReportStage = (osmium: RunOsmium = runOsmium, checkImage = ensureOsmiumImage): PipelineStage => ({
  id: REPORT_STAGE_ID,
  // v5: generated-world report (T-204).
  version: 5,
  outputs: OUTPUTS,
  inputFiles: (ctx) => [
    ctx.outputOf(EXPORT_STAGE_ID, FEATURES_FILE),
    ctx.outputOf(ROADS_STAGE_ID, ROAD_STATS_FILE),
    ...Object.values(WORLD_INPUTS).map(([stage, file]) => ctx.outputOf(stage, file)),
    ...(isSnapshot(ctx)
      ? [ctx.outputOf(EXTRACT_STAGE_ID, BOUNDARY_FILE), ctx.outputOf(EXTRACT_STAGE_ID, COMMUNE_PBF_FILE)]
      : []),
  ],
  params: (ctx) => ({ commune: ctx.config.commune, image: isSnapshot(ctx) ? OSMIUM_IMAGE : null }),
  run: async (ctx, outDir) => {
    if (isSnapshot(ctx)) await checkImage();
    const boundary = await loadBoundary(ctx);
    const stats = emptyStats();
    const cover = new GapCover();
    for await (const feature of readFeatures(ctx.outputOf(EXPORT_STAGE_ID, FEATURES_FILE))) {
      addFeature(stats, feature, boundary);
      cover.collect(feature);
    }

    const facts = {
      commune: ctx.config.displayName,
      snapshot: snapshotLabel(ctx),
      boundaryRelation: ctx.config.boundary.osmRelationId,
      areaKm2: boundary ? areaM2(boundary) / 1e6 : null,
      stats,
      busRoutes: await loadBusRoutes(ctx, osmium, outDir),
      gapTilesByCover: boundary ? classifyGapTiles(stats.buildingsPerTile, boundary, cover) : null,
      roadGraph: JSON.parse(await readFile(ctx.outputOf(ROADS_STAGE_ID, ROAD_STATS_FILE), 'utf8')) as RoadGraphStats,
    };
    const svg = renderDensitySvg(
      {
        buildingsPerTile: stats.buildingsPerTile,
        boundary,
        title: `${ctx.config.displayName} — building density (OSM)`,
      },
      boundary ? boundaryUtmBounds(bboxOf(boundary)) : null,
      utmToLonLatFactory(fromUtm30n),
    );
    await writeFile(join(outDir, 'coverage-report.json'), `${JSON.stringify(facts, null, 2)}\n`);
    await writeFile(join(outDir, 'coverage-report.md'), renderReportMarkdown(facts));
    await writeFile(join(outDir, 'building-density.svg'), svg);
    await writeWorldReport(ctx, outDir);
  },
});
