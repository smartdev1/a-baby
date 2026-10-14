/**
 * Role: finds the neighbourhood of a point from the OSM `place=*` features: the neighbourhood polygon containing it, else the nearest neighbourhood / village point, else the nearest suburb point, within a distance (flatbush). Suburb polygons (commune scale) are ignored.
 * Owner: backend
 */

import Flatbush from 'flatbush';
import type { ClassifiedRecord, UtmPoint, UtmRing } from '../records/map-records.ts';

/** Place kinds that name a part of the city, from the most specific. Suburbs are a last resort (often whole communes). */
const AREA_PLACES = new Set(['quarter', 'neighbourhood']);
const POINT_PLACES = new Set(['quarter', 'neighbourhood', 'village', 'hamlet', 'locality']);
const FALLBACK_POINT_PLACES = new Set(['suburb']);

const inRing = (ring: UtmRing, e: number, n: number): boolean => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, zi] = ring[i] ?? [0, 0];
    const [xj, zj] = ring[j] ?? [0, 0];
    if (zi > n !== zj > n && e < ((xj - xi) * (n - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
};

interface NamedArea {
  readonly name: string;
  readonly rings: readonly UtmRing[];
}

export class NeighbourhoodIndex {
  private readonly areas: NamedArea[] = [];
  private readonly points = new PointSet();
  private readonly fallbackPoints = new PointSet();
  private areaIndex: Flatbush | null = null;

  /** Keeps named place features (call for every classified record, then `finish()`). */
  add(r: Pick<ClassifiedRecord, 'tags' | 'geometry'>): void {
    const name = r.tags['name'];
    const place = r.tags['place'] ?? '';
    if (!name) return;
    if (r.geometry.type === 'MultiPolygon' && AREA_PLACES.has(place)) this.areas.push({ name, rings: r.geometry.coordinates.map((p) => p[0] ?? []) });
    if (r.geometry.type !== 'Point') return;
    if (POINT_PLACES.has(place)) this.points.add(name, r.geometry.coordinates);
    else if (FALLBACK_POINT_PLACES.has(place)) this.fallbackPoints.add(name, r.geometry.coordinates);
  }

  finish(): this {
    if (this.areas.length > 0) {
      this.areaIndex = new Flatbush(this.areas.length);
      for (const a of this.areas) {
        const pts = a.rings.flat();
        this.areaIndex.add(Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1])));
      }
      this.areaIndex.finish();
    }
    this.points.finish();
    this.fallbackPoints.finish();
    return this;
  }

  get size(): number {
    return this.areas.length + this.points.size + this.fallbackPoints.size;
  }

  /** Smallest containing polygon (most specific), else nearest point within `maxDistanceM`; null outside every neighbourhood. */
  nameAt(e: number, n: number, maxDistanceM: number): string | null {
    const containing = (this.areaIndex?.search(e, n, e, n) ?? [])
      .map((i) => this.areas[i])
      .filter((a): a is NamedArea => a !== undefined && a.rings.some((ring) => inRing(ring, e, n)));
    if (containing.length > 0) return containing.sort((a, b) => a.rings.flat().length - b.rings.flat().length)[0]?.name ?? null;
    return this.points.nearest(e, n, maxDistanceM) ?? this.fallbackPoints.nearest(e, n, maxDistanceM);
  }
}

class PointSet {
  private readonly items: { readonly name: string; readonly at: UtmPoint }[] = [];
  private index: Flatbush | null = null;

  get size(): number {
    return this.items.length;
  }

  add(name: string, at: UtmPoint): void {
    this.items.push({ name, at });
  }

  finish(): void {
    if (this.items.length === 0) return;
    this.index = new Flatbush(this.items.length);
    for (const { at } of this.items) this.index.add(at[0], at[1], at[0], at[1]);
    this.index.finish();
  }

  nearest(e: number, n: number, maxDistanceM: number): string | null {
    const [i] = this.index?.neighbors(e, n, 1, maxDistanceM) ?? [];
    return i === undefined ? null : (this.items[i]?.name ?? null);
  }
}
