/**
 * Role: cuts geometry at tile borders: polygons with polygon-clipping (only when they cross a border), polylines with Liang–Barsky, output in tile-local metres.
 * Owner: backend
 */

import polygonClipping, { type MultiPolygon as PcMultiPolygon, type Pair } from 'polygon-clipping';
import type { UtmPoint, UtmRing } from '../records/map-records.ts';
import type { LocalPoint, LocalPolygon } from './tile-content.ts';
import { TILE_SIZE_M, type TileOrigin, toLocal } from './tile-frame.ts';

const toCm = (v: number): number => Math.round(v * 100) / 100;

const insideTile = ([x, z]: LocalPoint): boolean => x >= 0 && x <= TILE_SIZE_M && z >= 0 && z <= TILE_SIZE_M;

const TILE_SQUARE: Pair[][] = [
  [
    [0, 0],
    [TILE_SIZE_M, 0],
    [TILE_SIZE_M, TILE_SIZE_M],
    [0, TILE_SIZE_M],
    [0, 0],
  ],
];

/** Polygons (outer ring + holes) of a footprint inside one tile, in local metres. */
export const clipPolygonsToTile = (polygons: readonly (readonly UtmRing[])[], origin: TileOrigin): LocalPolygon[] => {
  const local = polygons.map((rings) => rings.map((ring) => ring.map((p) => toLocal(p, origin))));
  if (local.every((rings) => rings.every((ring) => ring.every(insideTile)))) return local;
  const clipped: PcMultiPolygon = polygonClipping.intersection(local as unknown as PcMultiPolygon, TILE_SQUARE);
  return clipped.map((rings) => rings.map((ring) => ring.map(([x, z]) => [toCm(x), toCm(z)] as LocalPoint)));
};

/** Liang–Barsky: part of segment a→b inside the tile square, as parameters [t0, t1], or null. */
const clipSegment = (a: LocalPoint, b: LocalPoint): [number, number] | null => {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  let t0 = 0;
  let t1 = 1;
  const edges: [number, number][] = [
    [-dx, a[0]],
    [dx, TILE_SIZE_M - a[0]],
    [-dz, a[1]],
    [dz, TILE_SIZE_M - a[1]],
  ];
  for (const [p, q] of edges) {
    if (p === 0) {
      if (q < 0) return null;
      continue;
    }
    const r = q / p;
    if (p < 0) t0 = Math.max(t0, r);
    else t1 = Math.min(t1, r);
    if (t0 > t1) return null;
  }
  return [t0, t1];
};

const lerp = (a: LocalPoint, b: LocalPoint, t: number): LocalPoint => [
  toCm(a[0] + (b[0] - a[0]) * t),
  toCm(a[1] + (b[1] - a[1]) * t),
];

/** Pieces of a polyline inside one tile, in local metres (a line leaving and re-entering gives several pieces). */
export const clipPolylineToTile = (line: readonly UtmPoint[], origin: TileOrigin): LocalPoint[][] => {
  const local = line.map((p) => toLocal(p, origin));
  const pieces: LocalPoint[][] = [];
  let current: LocalPoint[] = [];
  for (let k = 1; k < local.length; k++) {
    const a = local[k - 1];
    const b = local[k];
    if (!a || !b) continue;
    const range = clipSegment(a, b);
    if (!range) {
      if (current.length > 1) pieces.push(current);
      current = [];
      continue;
    }
    const start = lerp(a, b, range[0]);
    const end = lerp(a, b, range[1]);
    if (current.length === 0) current.push(start);
    current.push(end);
    if (range[1] < 1) {
      if (current.length > 1) pieces.push(current);
      current = [];
    }
  }
  if (current.length > 1) pieces.push(current);
  return pieces;
};
