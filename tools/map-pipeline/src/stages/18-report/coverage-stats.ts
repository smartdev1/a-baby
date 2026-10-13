/**
 * Role: accumulates coverage statistics of a commune (buildings, heights, roads per class, POIs, density per L0 tile), restricted to the boundary when known.
 * Owner: backend
 */

import { tileKeyOf, toUtm30n } from '@skyline/geo';
import { containsPoint, type Geometry, lengthM, representativePoint } from '../../geometry/geojson-geometry.ts';
import type { OsmFeature } from './feature-stream.ts';
import { buildingType, hasHeight, hasLevels, hasName, isBuilding, poiCategory, roadClass } from './feature-kinds.ts';

export interface CoverageStats {
  featuresRead: number;
  featuresInside: number;
  buildings: number;
  buildingsWithHeight: number;
  buildingsWithLevels: number;
  buildingTypes: Record<string, number>;
  roadKmByClass: Record<string, number>;
  pois: number;
  poisNamed: number;
  poiCategories: Record<string, number>;
  /** Building count per L0 tile key. */
  buildingsPerTile: Record<string, number>;
}

export const emptyStats = (): CoverageStats => ({
  featuresRead: 0,
  featuresInside: 0,
  buildings: 0,
  buildingsWithHeight: 0,
  buildingsWithLevels: 0,
  buildingTypes: {},
  roadKmByClass: {},
  pois: 0,
  poisNamed: 0,
  poiCategories: {},
  buildingsPerTile: {},
});

const bump = (map: Record<string, number>, key: string, by = 1): void => {
  map[key] = (map[key] ?? 0) + by;
};

const addBuilding = (stats: CoverageStats, f: OsmFeature, geometry: Geometry): void => {
  stats.buildings++;
  if (hasHeight(f)) stats.buildingsWithHeight++;
  if (hasLevels(f)) stats.buildingsWithLevels++;
  bump(stats.buildingTypes, buildingType(f));
  const [lonDeg, latDeg] = representativePoint(geometry);
  bump(stats.buildingsPerTile, tileKeyOf(toUtm30n({ lonDeg, latDeg }), 0));
};

/** Adds one feature; `boundary` null = no clipping (fixture). */
export const addFeature = (stats: CoverageStats, f: OsmFeature, boundary: Geometry | null): void => {
  stats.featuresRead++;
  const geometry = f.geometry;
  if (!geometry) return;
  if (boundary && !containsPoint(boundary, representativePoint(geometry))) return;
  stats.featuresInside++;

  if (isBuilding(f)) addBuilding(stats, f, geometry);
  const road = roadClass(f);
  if (road) bump(stats.roadKmByClass, road, lengthM(geometry) / 1000);
  const poi = poiCategory(f);
  if (poi) {
    stats.pois++;
    if (hasName(f)) stats.poisNamed++;
    bump(stats.poiCategories, `${poi.key}=${poi.value}`);
  }
};

/** Entries sorted by value, descending, then key (stable output). */
export const topEntries = (map: Record<string, number>, limit: number): [string, number][] =>
  Object.entries(map)
    .sort(([ka, a], [kb, b]) => b - a || (ka < kb ? -1 : 1))
    .slice(0, limit);
