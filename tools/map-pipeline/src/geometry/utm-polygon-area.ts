/**
 * Role: area in m² of a UTM (Multi)Polygon footprint: outer rings minus holes (shoelace formula).
 * Owner: backend
 */

import type { UtmRing } from '../records/map-records.ts';

const ringArea = (ring: UtmRing): number => {
  let twice = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[j];
    const b = ring[i];
    if (a && b) twice += a[0] * b[1] - b[0] * a[1];
  }
  return Math.abs(twice) / 2;
};

export const multiPolygonAreaM2 = (polygons: readonly (readonly UtmRing[])[]): number =>
  polygons.reduce((sum, [outer, ...holes]) => sum + (outer ? ringArea(outer) : 0) - holes.reduce((h, r) => h + ringArea(r), 0), 0);
