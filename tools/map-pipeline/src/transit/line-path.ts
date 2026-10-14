/**
 * Role: rebuilds the path of a line from its member ways in order, using the road graph edges of each way (chained end to end), each way oriented to continue the previous one; gaps between ways are measured.
 * Owner: backend
 */

import type { UtmPoint } from '../records/map-records.ts';
import type { RoadEdge } from '../roads/road-graph-types.ts';

export interface LinePath {
  readonly polyline: UtmPoint[];
  readonly lengthM: number;
  /** Member ways not found in the road graph (outside the extract, not drivable…). */
  readonly missingWays: number;
  /** Sum of the jumps between consecutive ways (0 for a continuous path). */
  readonly gapsM: number;
}

const dist = (a: UtmPoint, b: UtmPoint): number => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** Geometry of one way: its edges chained from → to (edges of a way follow its node order). */
export const wayPolyline = (edges: readonly RoadEdge[]): UtmPoint[] => {
  if (edges.length === 0) return [];
  const byFrom = new Map(edges.map((e) => [e.from, e]));
  const targets = new Set(edges.map((e) => e.to));
  let current = edges.find((e) => !targets.has(e.from)) ?? edges[0];
  const out: UtmPoint[] = [];
  const seen = new Set<string>();
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    out.push(...(out.length > 0 ? current.geometry.slice(1) : current.geometry));
    current = byFrom.get(current.to);
  }
  return out;
};

const polylineLength = (pts: readonly UtmPoint[]): number => pts.slice(1).reduce((s, p, k) => s + dist(pts[k] ?? p, p), 0);

/** Orients a way: continue from the path end, or (first way) point towards the next way. */
const orient = (way: UtmPoint[], end: UtmPoint | undefined, next: readonly UtmPoint[]): UtmPoint[] => {
  const first = way[0];
  const last = way.at(-1);
  if (!first || !last) return way;
  if (end) return dist(end, last) < dist(end, first) ? [...way].reverse() : way;
  if (next.length === 0) return way;
  const touch = (p: UtmPoint): number => Math.min(dist(p, next[0] ?? p), dist(p, next.at(-1) ?? p));
  return touch(first) < touch(last) ? [...way].reverse() : way;
};

/** `wayIds` in relation order (`osm:way/123`); `edgesByWay` from road-edges.ndjson. */
export const linePath = (wayIds: readonly string[], edgesByWay: ReadonlyMap<string, readonly RoadEdge[]>): LinePath => {
  const polyline: UtmPoint[] = [];
  let missingWays = 0;
  let gapsM = 0;
  wayIds.forEach((wayId, k) => {
    const raw = wayPolyline(edgesByWay.get(wayId) ?? []);
    if (raw.length < 2) {
      missingWays++;
      return;
    }
    const end = polyline.at(-1);
    const way = orient(raw, end, end ? [] : wayPolyline(edgesByWay.get(wayIds[k + 1] ?? '') ?? []));
    const start = way[0] ?? raw[0] ?? [0, 0];
    if (end) gapsM += dist(end, start);
    polyline.push(...(end && dist(end, start) < 0.01 ? way.slice(1) : way));
  });
  return { polyline, lengthM: Math.round(polylineLength(polyline)), missingWays, gapsM: Math.round(gapsM) };
};
