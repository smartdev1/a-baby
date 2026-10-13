/**
 * Role: tells whether a UTM point is water: OSM coastlines (water is on the right of the way direction, nearest segment wins, flatbush kNN) and water polygons.
 * Owner: backend
 */

import Flatbush from 'flatbush';
import type { UtmPoint, UtmRing } from '../records/map-records.ts';

interface Segment {
  readonly a: UtmPoint;
  readonly b: UtmPoint;
}

const pointInRings = (rings: readonly UtmRing[], e: number, n: number): boolean => {
  let inside = false;
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, zi] = ring[i] ?? [0, 0];
      const [xj, zj] = ring[j] ?? [0, 0];
      if (zi > n !== zj > n && e < ((xj - xi) * (n - zi)) / (zj - zi) + xi) inside = !inside;
    }
  }
  return inside;
};

export class WaterClassifier {
  private readonly segments: Segment[];
  private readonly coastIndex: Flatbush | null;
  private readonly polygons: { rings: readonly UtmRing[]; bbox: [number, number, number, number] }[];
  private readonly polygonIndex: Flatbush | null;

  constructor(coastlines: readonly (readonly UtmPoint[])[], waterPolygons: readonly (readonly UtmRing[])[]) {
    this.segments = coastlines.flatMap((line) => line.slice(1).map((b, k) => ({ a: line[k] ?? b, b })));
    this.coastIndex = this.segments.length > 0 ? new Flatbush(this.segments.length) : null;
    for (const { a, b } of this.segments) this.coastIndex?.add(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1]));
    this.coastIndex?.finish();
    this.polygons = waterPolygons.map((rings) => {
      const pts = rings.flat();
      return { rings, bbox: [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1]))] };
    });
    this.polygonIndex = this.polygons.length > 0 ? new Flatbush(this.polygons.length) : null;
    for (const { bbox } of this.polygons) this.polygonIndex?.add(...bbox);
    this.polygonIndex?.finish();
  }

  isWater(e: number, n: number): boolean {
    if (this.polygonIndex?.search(e, n, e, n).some((i) => pointInRings(this.polygons[i]?.rings ?? [], e, n))) return true;
    return this.rightOfNearestCoast(e, n);
  }

  private rightOfNearestCoast(e: number, n: number): boolean {
    if (!this.coastIndex) return false;
    const [nearest] = this.coastIndex.neighbors(e, n, 1);
    const seg = nearest === undefined ? undefined : this.segments[nearest];
    if (!seg) return false;
    const cross = (seg.b[0] - seg.a[0]) * (n - seg.a[1]) - (seg.b[1] - seg.a[1]) * (e - seg.a[0]);
    return cross < 0; // negative cross product = point on the right of a → b = water side
  }
}
