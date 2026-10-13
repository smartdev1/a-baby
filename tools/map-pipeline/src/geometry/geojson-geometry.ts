/**
 * Role: minimal GeoJSON geometry helpers on WGS84 data: bounding box, representative point, point-in-polygon, area and length in metres (via UTM 30N).
 * Owner: backend
 */

import { toUtm30n } from '@skyline/geo';
import type { BboxLonLat } from './expand-bbox.ts';

export type Position = readonly [number, number, ...number[]];
export type Ring = readonly Position[];

export type Geometry =
  | { type: 'Point'; coordinates: Position }
  | { type: 'LineString'; coordinates: readonly Position[] }
  | { type: 'MultiLineString'; coordinates: readonly (readonly Position[])[] }
  | { type: 'Polygon'; coordinates: readonly Ring[] }
  | { type: 'MultiPolygon'; coordinates: readonly (readonly Ring[])[] };

const allPositions = (g: Geometry): readonly Position[] => {
  switch (g.type) {
    case 'Point':
      return [g.coordinates];
    case 'LineString':
      return g.coordinates;
    case 'MultiLineString':
    case 'Polygon':
      return g.coordinates.flat();
    case 'MultiPolygon':
      return g.coordinates.flat(2);
  }
};

export const bboxOf = (g: Geometry): BboxLonLat => {
  const pts = allPositions(g);
  const lons = pts.map((p) => p[0]);
  const lats = pts.map((p) => p[1]);
  return [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)];
};

/** Average of the vertices (outer ring for areas): cheap and good enough to place a feature in a tile. */
export const representativePoint = (g: Geometry): Position => {
  const pts = g.type === 'Polygon' ? (g.coordinates[0] ?? []) : g.type === 'MultiPolygon' ? (g.coordinates[0]?.[0] ?? []) : allPositions(g);
  const n = Math.max(pts.length, 1);
  return [pts.reduce((s, p) => s + p[0], 0) / n, pts.reduce((s, p) => s + p[1], 0) / n];
};

const insideRing = ([x, y]: Position, ring: Ring): boolean => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i] ?? [0, 0];
    const [xj, yj] = ring[j] ?? [0, 0];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

/** Even-odd test on every polygon of a (Multi)Polygon, holes included. */
export const containsPoint = (area: Geometry, point: Position): boolean => {
  const polygons = area.type === 'Polygon' ? [area.coordinates] : area.type === 'MultiPolygon' ? area.coordinates : [];
  return polygons.some((rings) => rings.filter((ring) => insideRing(point, ring)).length % 2 === 1);
};

const ringAreaM2 = (ring: Ring): number => {
  const utm = ring.map((p) => toUtm30n({ lonDeg: p[0], latDeg: p[1] }));
  let twice = 0;
  for (let i = 0, j = utm.length - 1; i < utm.length; j = i++) {
    const a = utm[j];
    const b = utm[i];
    if (a && b) twice += a.eastingM * b.northingM - b.eastingM * a.northingM;
  }
  return Math.abs(twice) / 2;
};

/** Area in m² (outer rings minus holes), measured in UTM 30N. */
export const areaM2 = (g: Geometry): number => {
  const polygons = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
  return polygons.reduce((sum, [outer, ...holes]) => sum + (outer ? ringAreaM2(outer) : 0) - holes.reduce((h, r) => h + ringAreaM2(r), 0), 0);
};

/** Length in metres of a (Multi)LineString, measured in UTM 30N. */
export const lengthM = (g: Geometry): number => {
  const lines = g.type === 'LineString' ? [g.coordinates] : g.type === 'MultiLineString' ? g.coordinates : [];
  let total = 0;
  for (const line of lines) {
    const utm = line.map((p) => toUtm30n({ lonDeg: p[0], latDeg: p[1] }));
    for (let i = 1; i < utm.length; i++) {
      const a = utm[i - 1];
      const b = utm[i];
      if (a && b) total += Math.hypot(b.eastingM - a.eastingM, b.northingM - a.northingM);
    }
  }
  return total;
};
