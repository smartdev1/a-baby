/**
 * Role: measured polylines for line vehicles: cumulative lengths, point and heading at a distance along the path, forward projection of stops onto the path.
 * Owner: backend
 */

import type { Point } from './road-graph.ts';

export interface MeasuredPolyline {
  readonly points: readonly Point[];
  /** `cumulative[i]` = metres from the first point to `points[i]`. */
  readonly cumulative: readonly number[];
  readonly lengthM: number;
}

export interface PointAlong {
  readonly x: number;
  readonly y: number;
  /** Direction of travel, radians from +x towards +y. */
  readonly headingRad: number;
}

export const measurePolyline = (points: readonly Point[]): MeasuredPolyline => {
  if (points.length < 2) throw new RangeError('a polyline needs at least 2 points');
  const cumulative = [0];
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1] as Point;
    const [bx, by] = points[i] as Point;
    cumulative.push((cumulative[i - 1] as number) + Math.hypot(bx - ax, by - ay));
  }
  return { points, cumulative, lengthM: cumulative[cumulative.length - 1] as number };
};

/** Index of the segment containing `distanceM` (binary search). */
const segmentAt = (poly: MeasuredPolyline, distanceM: number): number => {
  let lo = 0;
  let hi = poly.points.length - 2;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if ((poly.cumulative[mid] as number) <= distanceM) lo = mid;
    else hi = mid - 1;
  }
  return lo;
};

export const pointAlong = (poly: MeasuredPolyline, distanceM: number): PointAlong => {
  const d = Math.min(Math.max(distanceM, 0), poly.lengthM);
  const i = segmentAt(poly, d);
  const [ax, ay] = poly.points[i] as Point;
  const [bx, by] = poly.points[i + 1] as Point;
  const len = (poly.cumulative[i + 1] as number) - (poly.cumulative[i] as number);
  const t = len > 0 ? (d - (poly.cumulative[i] as number)) / len : 0;
  return { x: ax + (bx - ax) * t, y: ay + (by - ay) * t, headingRad: Math.atan2(by - ay, bx - ax) };
};

/** Distance along one segment of the point closest to `p`. */
const projectOnSegment = (poly: MeasuredPolyline, i: number, p: Point): { distanceM: number; offM: number } => {
  const [ax, ay] = poly.points[i] as Point;
  const [bx, by] = poly.points[i + 1] as Point;
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 > 0 ? Math.min(Math.max(((p[0] - ax) * dx + (p[1] - ay) * dy) / len2, 0), 1) : 0;
  const offM = Math.hypot(ax + dx * t - p[0], ay + dy * t - p[1]);
  return { distanceM: (poly.cumulative[i] as number) + Math.sqrt(len2) * t, offM };
};

/** Distance along the path of the point closest to `p`, at or after `fromM` (stops are met in order, even on loops). */
export const projectForward = (poly: MeasuredPolyline, p: Point, fromM = 0): number => {
  let best = { distanceM: fromM, offM: Number.POSITIVE_INFINITY };
  for (let i = segmentAt(poly, fromM); i < poly.points.length - 1; i++) {
    const hit = projectOnSegment(poly, i, p);
    if (hit.offM < best.offM && hit.distanceM >= fromM) best = hit;
  }
  return best.distanceM;
};
