/**
 * Role: tile-local frame helpers: tiles overlapped by a UTM bbox, tile of a point, conversion of UTM points to tile-local metres.
 * Owner: backend
 */

import { formatTileKey, isInsideGrid, parseTileKey, tileBounds, tileCoordOf, type UtmBounds } from '@skyline/geo';
import type { UtmPoint } from '../records/map-records.ts';
import type { LocalPoint } from './tile-content.ts';

export const TILE_SIZE_M = 250;

const toCm = (v: number): number => Math.round(v * 100) / 100;

export const boundsOfPoints = (points: readonly UtmPoint[]): UtmBounds => {
  let minE = Infinity;
  let minN = Infinity;
  let maxE = -Infinity;
  let maxN = -Infinity;
  for (const [e, n] of points) {
    minE = Math.min(minE, e);
    minN = Math.min(minN, n);
    maxE = Math.max(maxE, e);
    maxN = Math.max(maxN, n);
  }
  return { minEastingM: minE, minNorthingM: minN, maxEastingM: maxE, maxNorthingM: maxN };
};

/** L0 tile keys whose square intersects the bbox (points outside the world grid are ignored). */
export const tilesOverlapping = (b: UtmBounds): string[] => {
  const sw = { eastingM: b.minEastingM, northingM: b.minNorthingM };
  const ne = { eastingM: b.maxEastingM, northingM: b.maxNorthingM };
  if (!isInsideGrid(sw) || !isInsideGrid(ne)) return [];
  const a = tileCoordOf(sw, 0);
  const z = tileCoordOf(ne, 0);
  const keys: string[] = [];
  for (let j = a.j; j <= z.j; j++) for (let i = a.i; i <= z.i; i++) keys.push(formatTileKey({ level: 0, i, j }));
  return keys;
};

export const tileOfPoint = ([e, n]: UtmPoint): string | null => {
  const p = { eastingM: e, northingM: n };
  return isInsideGrid(p) ? formatTileKey(tileCoordOf(p, 0)) : null;
};

export interface TileOrigin {
  readonly eastingM: number;
  readonly northingM: number;
}

export const tileOrigin = (key: string): TileOrigin => {
  const b = tileBounds(key);
  return { eastingM: b.minEastingM, northingM: b.minNorthingM };
};

export const toLocal = ([e, n]: UtmPoint, origin: TileOrigin): LocalPoint => [
  toCm(e - origin.eastingM),
  toCm(n - origin.northingM),
];

/** The 8 surrounding tile keys (some may be empty or outside the release). */
export const neighbourKeys = (key: string): string[] => {
  const { i, j } = parseTileKey(key);
  const keys: string[] = [];
  for (let dj = -1; dj <= 1; dj++)
    for (let di = -1; di <= 1; di++) if (di || dj) keys.push(formatTileKey({ level: 0, i: i + di, j: j + dj }));
  return keys;
};
