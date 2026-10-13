/**
 * Role: stage 10-terrain: ground relief (Copernicus DEM via GDAL, filtered to bare ground, roads levelled) and water (coastlines + water polygons) for every L0 tile of the commune.
 * Owner: backend
 */

import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { formatTileKey, tileCoordOf } from '@skyline/geo';
import { OSMIUM_IMAGE } from '../../osmium/osmium-commands.ts';
import { ensureOsmiumImage, runTool } from '../../osmium/run-osmium.ts';
import type { ClassifiedRecord, UtmPoint, UtmRing } from '../../records/map-records.ts';
import { readNdjson, writeNdjson } from '../../records/ndjson-files.ts';
import type { RoadEdge } from '../../roads/road-graph-types.ts';
import type { PipelineStage, StageContext } from '../../runner/stage-contract.ts';
import { downloadFile } from '../../sources/download-file.ts';
import { ensureLockedFile } from '../../sources/ensure-locked-file.ts';
import { DEM_CACHE_DIR, loadSourcesLockSync } from '../../sources/sources-lock.ts';
import { type RasterExtent, readEnviFloat32 } from '../../terrain/envi-raster.ts';
import { groundFromSurface } from '../../terrain/ground-filter.ts';
import { HeightGrid } from '../../terrain/height-grid.ts';
import { levelRoads } from '../../terrain/road-levelling.ts';
import { buildTileTerrain, TERRAIN_CELL_M, type TileTerrain } from '../../terrain/tile-terrain.ts';
import { WaterClassifier } from '../../terrain/water-classifier.ts';
import { BOUNDARY_FILE, EXTRACT_STAGE_ID } from '../02-extract/extract-stage.ts';
import { CLASSIFIED_FILE, CLASSIFY_STAGE_ID } from '../05-classify/classify-stage.ts';
import { ROADS_STAGE_ID } from '../08-roads/roads-stage.ts';
import { extentFromBoundary, extentFromRecords } from './terrain-extent.ts';

export const TERRAIN_STAGE_ID = '10-terrain';
export const TERRAIN_FILE = 'terrain-tiles.ndjson';
const ROAD_EDGES = 'road-edges.ndjson';

const demPath = (ctx: StageContext): string | null => {
  if (ctx.config.source.kind !== 'osm-snapshot') return null;
  const { dem } = loadSourcesLockSync(ctx.fromRepo(ctx.config.source.lockFile));
  return dem ? ctx.fromRepo(`${DEM_CACHE_DIR}/${dem.fileName}`) : null;
};

/** Reprojects the DEM onto the UTM 5 m grid of the extent with GDAL (Docker), then reads it. */
const warpDem = async (ctx: StageContext, outDir: string, extent: RasterExtent): Promise<HeightGrid> => {
  if (ctx.config.source.kind !== 'osm-snapshot') throw new Error('DEM only for OSM snapshot sources');
  const { dem } = loadSourcesLockSync(ctx.fromRepo(ctx.config.source.lockFile));
  const path = demPath(ctx);
  if (!dem || !path) throw new Error('sources.lock.json has no dem entry');
  if (!existsSync(path)) ctx.logger.info({ url: dem.url }, 'downloading DEM tile');
  await ensureLockedFile(dem, path, downloadFile);
  await ensureOsmiumImage();
  const args = ['-q', '-overwrite', '-t_srs', 'EPSG:32630', '-te', ...[extent.minE, extent.minN, extent.maxE, extent.maxN].map(String), '-tr', String(extent.cellM), String(extent.cellM), '-r', 'bilinear', '-ot', 'Float32', '-of', 'ENVI', '-dstnodata', '-9999', `/in/${basename(path)}`, '/out/dem-utm.bin'];
  await runTool('gdalwarp', args, { inputDir: dirname(path), outputDir: outDir });
  return readEnviFloat32(join(outDir, 'dem-utm.bin'), extent);
};

const waterInputs = (records: readonly ClassifiedRecord[]): { coastlines: UtmPoint[][]; polygons: UtmRing[][] } => {
  const coastlines: UtmPoint[][] = [];
  const polygons: UtmRing[][] = [];
  for (const r of records) {
    const t = r.tags;
    if (t['natural'] === 'coastline' && r.geometry.type === 'LineString') coastlines.push([...r.geometry.coordinates]);
    const isWaterArea = t['natural'] === 'water' || t['waterway'] === 'riverbank' || t['landuse'] === 'reservoir' || t['landuse'] === 'basin';
    if (isWaterArea && r.geometry.type === 'MultiPolygon') polygons.push(...r.geometry.coordinates.map((p) => [...p]));
  }
  return { coastlines, polygons };
};

const tileKeysOf = (extent: RasterExtent): string[] => {
  const keys: string[] = [];
  const sw = tileCoordOf({ eastingM: extent.minE, northingM: extent.minN }, 0);
  const ne = tileCoordOf({ eastingM: extent.maxE - 1, northingM: extent.maxN - 1 }, 0);
  for (let j = sw.j; j <= ne.j; j++) for (let i = sw.i; i <= ne.i; i++) keys.push(formatTileKey({ level: 0, i, j }));
  return keys;
};

export const terrainStage: PipelineStage = {
  id: TERRAIN_STAGE_ID,
  version: 1,
  outputs: [TERRAIN_FILE, 'terrain-report.json'],
  inputFiles: (ctx) => {
    const dem = demPath(ctx);
    const snapshot = ctx.config.source.kind === 'osm-snapshot';
    return [
      ctx.outputOf(CLASSIFY_STAGE_ID, CLASSIFIED_FILE),
      ctx.outputOf(ROADS_STAGE_ID, ROAD_EDGES),
      ...(snapshot ? [ctx.outputOf(EXTRACT_STAGE_ID, BOUNDARY_FILE), ctx.fromRepo(ctx.config.source.kind === 'osm-snapshot' ? ctx.config.source.lockFile : '')] : []),
      ...(dem && existsSync(dem) ? [dem] : []),
    ];
  },
  params: () => ({ cellM: TERRAIN_CELL_M, filter: [4, 3], image: OSMIUM_IMAGE }),
  run: async (ctx, outDir) => {
    const records: ClassifiedRecord[] = [];
    for await (const r of readNdjson<ClassifiedRecord>(ctx.outputOf(CLASSIFY_STAGE_ID, CLASSIFIED_FILE))) records.push(r);
    const snapshot = ctx.config.source.kind === 'osm-snapshot';
    const extent = snapshot ? await extentFromBoundary(ctx, TERRAIN_CELL_M) : extentFromRecords(records, TERRAIN_CELL_M);
    const size = { cols: (extent.maxE - extent.minE) / extent.cellM, rows: (extent.maxN - extent.minN) / extent.cellM };
    const ground = snapshot ? groundFromSurface(await warpDem(ctx, outDir, extent)) : HeightGrid.flat({ minE: extent.minE, minN: extent.minN, cellM: extent.cellM, ...size });

    const edges: RoadEdge[] = [];
    for await (const e of readNdjson<RoadEdge>(ctx.outputOf(ROADS_STAGE_ID, ROAD_EDGES))) if (e.cars) edges.push(e);
    const levelled = levelRoads(ground, edges);
    const { coastlines, polygons } = waterInputs(records);
    const water = new WaterClassifier(coastlines, polygons);

    const keys = tileKeysOf(extent);
    const tiles: TileTerrain[] = keys.map((key) => buildTileTerrain(key, ground, water));
    await writeNdjson(join(outDir, TERRAIN_FILE), tiles);
    let minHeightM = Infinity;
    let maxHeightM = -Infinity;
    for (const t of tiles) for (const h of t.heightsM) [minHeightM, maxHeightM] = [Math.min(minHeightM, h), Math.max(maxHeightM, h)];
    const report = { tiles: tiles.length, waterTiles: tiles.filter((t) => t.water).length, minHeightM, maxHeightM, levelledCells: levelled, coastlines: coastlines.length, waterPolygons: polygons.length };
    await writeFile(join(outDir, 'terrain-report.json'), `${JSON.stringify(report, null, 2)}\n`);
    ctx.logger.info(report, 'terrain built');
  },
};
