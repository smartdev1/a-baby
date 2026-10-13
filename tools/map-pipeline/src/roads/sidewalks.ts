/**
 * Role: decides sidewalks per street: tags first, otherwise generated on both sides unless OSM already maps a footway running alongside (flatbush index over footway segments).
 * Owner: backend
 */

import Flatbush from 'flatbush';
import type { UtmPoint } from '../records/map-records.ts';
import { wantsSidewalks } from './road-classes.ts';
import type { RoadEdge, Sidewalks } from './road-graph-types.ts';
import { mappedSidewalks } from './road-way-tags.ts';

const SEARCH_M = 10;
const PARALLEL_COS = Math.cos((20 * Math.PI) / 180);

interface Segment {
  readonly a: UtmPoint;
  readonly b: UtmPoint;
}

const segmentsOf = (edges: readonly Omit<RoadEdge, 'sidewalks'>[]): Segment[] =>
  edges.flatMap((e) => e.geometry.slice(1).map((b, k) => ({ a: e.geometry[k] ?? b, b })));

const direction = ({ a, b }: Segment): [number, number] => {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
};

export class FootwayIndex {
  private readonly index: Flatbush | null;
  private readonly segments: Segment[];

  constructor(footways: readonly Omit<RoadEdge, 'sidewalks'>[]) {
    this.segments = segmentsOf(footways);
    this.index = this.segments.length > 0 ? new Flatbush(this.segments.length) : null;
    for (const { a, b } of this.segments) this.index?.add(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1]));
    this.index?.finish();
  }

  /** True when a mapped footway runs parallel to the street within 10 m. */
  hasParallelFootway(street: Omit<RoadEdge, 'sidewalks'>): boolean {
    if (!this.index) return false;
    for (const seg of segmentsOf([street])) {
      const [dx, dz] = direction(seg);
      const midX = (seg.a[0] + seg.b[0]) / 2;
      const midZ = (seg.a[1] + seg.b[1]) / 2;
      const hits = this.index.search(midX - SEARCH_M, midZ - SEARCH_M, midX + SEARCH_M, midZ + SEARCH_M);
      if (hits.some((i) => {
        const other = this.segments[i];
        if (!other) return false;
        const [ox, oz] = direction(other);
        return Math.abs(dx * ox + dz * oz) >= PARALLEL_COS;
      })) return true;
    }
    return false;
  }
}

export const sidewalksFor = (edge: Omit<RoadEdge, 'sidewalks'>, tags: Readonly<Record<string, string>>, footways: FootwayIndex): { sidewalks: Sidewalks; generated: boolean } => {
  const mapped = mappedSidewalks(tags);
  if (mapped && mapped !== 'separate') return { sidewalks: mapped, generated: false };
  if (mapped === 'separate' || !wantsSidewalks(edge.roadClass) || footways.hasParallelFootway(edge)) return { sidewalks: 'none', generated: false };
  return { sidewalks: 'both', generated: true };
};
