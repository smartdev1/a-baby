/**
 * Role: Douglas–Peucker simplification of closed rings in tile-local metres (distant buildings keep their shape with fewer vertices).
 * Owner: backend
 */

import type { LocalPoint } from '../tiling/tile-content.ts';

const distanceToSegment = (p: LocalPoint, a: LocalPoint, b: LocalPoint): number => {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz || 1)));
  return Math.hypot(p[0] - (a[0] + dx * t), p[1] - (a[1] + dz * t));
};

const simplifyOpen = (pts: readonly LocalPoint[], toleranceM: number): LocalPoint[] => {
  if (pts.length < 3) return [...pts];
  const first = pts[0] ?? [0, 0];
  const last = pts[pts.length - 1] ?? first;
  let index = 0;
  let max = 0;
  for (let k = 1; k < pts.length - 1; k++) {
    const d = distanceToSegment(pts[k] ?? first, first, last);
    if (d > max) [max, index] = [d, k];
  }
  if (max <= toleranceM) return [first, last];
  return [...simplifyOpen(pts.slice(0, index + 1), toleranceM).slice(0, -1), ...simplifyOpen(pts.slice(index), toleranceM)];
};

/** Closed ring in, closed ring out; null when fewer than 3 distinct vertices remain. */
export const simplifyRing = (ring: readonly LocalPoint[], toleranceM: number): LocalPoint[] | null => {
  if (ring.length < 4) return null;
  // Split at the vertex farthest from the first one so both halves are open polylines.
  const first = ring[0] ?? [0, 0];
  let far = 1;
  ring.forEach((p, k) => {
    if (Math.hypot(p[0] - first[0], p[1] - first[1]) > Math.hypot((ring[far]?.[0] ?? 0) - first[0], (ring[far]?.[1] ?? 0) - first[1])) far = k;
  });
  const out = [...simplifyOpen(ring.slice(0, far + 1), toleranceM).slice(0, -1), ...simplifyOpen(ring.slice(far), toleranceM)];
  return out.length >= 4 ? out : null;
};

export const ringAreaM2 = (ring: readonly LocalPoint[]): number => {
  let twice = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) twice += (ring[j]?.[0] ?? 0) * (ring[i]?.[1] ?? 0) - (ring[i]?.[0] ?? 0) * (ring[j]?.[1] ?? 0);
  return Math.abs(twice) / 2;
};
