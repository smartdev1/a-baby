/**
 * Role: extent of the terrain grid in UTM, snapped outward to the 250 m tile grid: commune boundary + margin (OSM snapshot) or all features (fixture).
 * Owner: backend
 */

import { readFile } from 'node:fs/promises';
import { GRID_ORIGIN, toUtm30n } from '@skyline/geo';
import { expandBbox } from '../../geometry/expand-bbox.ts';
import { bboxOf, type Geometry } from '../../geometry/geojson-geometry.ts';
import type { ClassifiedRecord } from '../../records/map-records.ts';
import type { StageContext } from '../../runner/stage-contract.ts';
import type { RasterExtent } from '../../terrain/envi-raster.ts';
import { BOUNDARY_FILE, EXTRACT_STAGE_ID } from '../02-extract/extract-stage.ts';

const TILE_M = 250;
const snapDown = (v: number, origin: number): number => origin + Math.floor((v - origin) / TILE_M) * TILE_M;
const snapUp = (v: number, origin: number): number => origin + Math.ceil((v - origin) / TILE_M) * TILE_M;

interface Bounds {
  readonly minE: number;
  readonly minN: number;
  readonly maxE: number;
  readonly maxN: number;
}

const snapped = (b: Bounds, cellM: number): RasterExtent => ({
  minE: snapDown(b.minE, GRID_ORIGIN.eastingM),
  minN: snapDown(b.minN, GRID_ORIGIN.northingM),
  maxE: snapUp(b.maxE, GRID_ORIGIN.eastingM),
  maxN: snapUp(b.maxN, GRID_ORIGIN.northingM),
  cellM,
});

export const extentFromBoundary = async (ctx: StageContext, cellM: number): Promise<RasterExtent> => {
  const { features } = JSON.parse(await readFile(ctx.outputOf(EXTRACT_STAGE_ID, BOUNDARY_FILE), 'utf8')) as { features: { geometry: Geometry }[] };
  const geometry = features[0]?.geometry;
  const bbox = geometry ? bboxOf(geometry) : ctx.config.boundary.provisionalBboxLonLat;
  if (!bbox) throw new Error('no boundary to size the terrain grid');
  const [w, s, e, n] = expandBbox(bbox, ctx.config.marginM);
  const corners = [toUtm30n({ lonDeg: w, latDeg: s }), toUtm30n({ lonDeg: e, latDeg: s }), toUtm30n({ lonDeg: w, latDeg: n }), toUtm30n({ lonDeg: e, latDeg: n })];
  const es = corners.map((c) => c.eastingM);
  const ns = corners.map((c) => c.northingM);
  return snapped({ minE: Math.min(...es), minN: Math.min(...ns), maxE: Math.max(...es), maxN: Math.max(...ns) }, cellM);
};

export const extentFromRecords = (records: readonly ClassifiedRecord[], cellM: number): RasterExtent => {
  const points = records.flatMap((r) => {
    const g = r.geometry;
    return g.type === 'Point' ? [g.coordinates] : g.type === 'LineString' ? g.coordinates : g.type === 'MultiLineString' ? g.coordinates.flat() : g.coordinates.flat(2);
  });
  let [minE, minN, maxE, maxN] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const [e, n] of points) [minE, minN, maxE, maxN] = [Math.min(minE, e), Math.min(minN, n), Math.max(maxE, e), Math.max(maxN, n)];
  return snapped({ minE, minN, maxE, maxN }, cellM);
};
