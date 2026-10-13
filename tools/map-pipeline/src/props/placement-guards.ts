/**
 * Role: spatial guards for placement (flatbush): inside a building footprint? on a carriageway? direction of the nearest road (to face it).
 * Owner: backend
 */

import Flatbush from 'flatbush';
import type { BuildingRecord, UtmPoint, UtmRing } from '../records/map-records.ts';
import type { RoadEdge } from '../roads/road-graph-types.ts';

const inRing = (ring: UtmRing, e: number, n: number): boolean => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, zi] = ring[i] ?? [0, 0];
    const [xj, zj] = ring[j] ?? [0, 0];
    if (zi > n !== zj > n && e < ((xj - xi) * (n - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
};

interface Segment {
  readonly a: UtmPoint;
  readonly b: UtmPoint;
  readonly halfWidthM: number;
}

export class PlacementGuards {
  private readonly footprints: UtmRing[];
  private readonly buildingIndex: Flatbush | null;
  private readonly segments: Segment[];
  private readonly roadIndex: Flatbush | null;

  constructor(buildings: readonly Pick<BuildingRecord, 'footprint'>[], roads: readonly Pick<RoadEdge, 'geometry' | 'widthM'>[]) {
    this.footprints = buildings.flatMap((b) => b.footprint.coordinates.map((p) => p[0] ?? []));
    this.buildingIndex = this.footprints.length > 0 ? new Flatbush(this.footprints.length) : null;
    for (const ring of this.footprints) {
      const es = ring.map((p) => p[0]);
      const ns = ring.map((p) => p[1]);
      this.buildingIndex?.add(Math.min(...es), Math.min(...ns), Math.max(...es), Math.max(...ns));
    }
    this.buildingIndex?.finish();
    this.segments = roads.flatMap((r) => r.geometry.slice(1).map((b, k) => ({ a: r.geometry[k] ?? b, b, halfWidthM: r.widthM / 2 })));
    this.roadIndex = this.segments.length > 0 ? new Flatbush(this.segments.length) : null;
    for (const { a, b } of this.segments) this.roadIndex?.add(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1]));
    this.roadIndex?.finish();
  }

  insideBuilding(e: number, n: number): boolean {
    return this.buildingIndex?.search(e, n, e, n).some((i) => inRing(this.footprints[i] ?? [], e, n)) ?? false;
  }

  onCarriageway(e: number, n: number, marginM = 0.5): boolean {
    return (
      this.roadIndex?.search(e - 10, n - 10, e + 10, n + 10).some((i) => {
        const s = this.segments[i];
        return s !== undefined && distanceToSegment(s, e, n) < s.halfWidthM + marginM;
      }) ?? false
    );
  }

  /** Yaw (0 = facing north, + towards east) that faces the nearest road, or 0 when none. */
  yawTowardsRoad(e: number, n: number): number {
    const [i] = this.roadIndex?.neighbors(e, n, 1) ?? [];
    const s = i === undefined ? undefined : this.segments[i];
    if (!s) return 0;
    const [px, pz] = closestOnSegment(s, e, n);
    return Math.atan2(px - e, pz - n);
  }

  free(e: number, n: number): boolean {
    return !this.insideBuilding(e, n) && !this.onCarriageway(e, n);
  }
}

const closestOnSegment = ({ a, b }: Segment, e: number, n: number): [number, number] => {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((e - a[0]) * dx + (n - a[1]) * dz) / (dx * dx + dz * dz || 1)));
  return [a[0] + dx * t, a[1] + dz * t];
};

const distanceToSegment = (s: Segment, e: number, n: number): number => {
  const [px, pz] = closestOnSegment(s, e, n);
  return Math.hypot(e - px, n - pz);
};
