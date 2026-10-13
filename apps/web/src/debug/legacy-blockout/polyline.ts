/**
 * Role: small 2D polyline helpers for the legacy blockout (distance, duplicate removal, ring closing, stable string hash).
 * Owner: frontend
 */

import type { Vec2 } from './blockout-types.ts';

const EPSILON_M = 1e-3;

export const distance = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.y - b.y);

/** Removes consecutive duplicate points (they break triangulation and normals). */
export const dedupePoints = (points: readonly Vec2[]): Vec2[] => {
  const out: Vec2[] = [];
  for (const point of points) {
    const last = out[out.length - 1];
    if (!last || distance(point, last) > EPSILON_M) out.push(point);
  }
  return out;
};

/** Returns an open ring: duplicates removed and the closing point dropped. */
export const openRing = (points: readonly Vec2[]): Vec2[] => {
  const ring = dedupePoints(points);
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first && last && ring.length > 1 && distance(first, last) <= EPSILON_M) ring.pop();
  return ring;
};

export const stringHash = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  return hash;
};
