/**
 * Role: 2D geometry on flat rings [x0, z0, x1, z1, …]: point-in-polygon, closest point on the boundary, circle push-out.
 * Owner: backend
 */

export const pointInRing = (ring: Float32Array, x: number, z: number): boolean => {
  let inside = false;
  const n = ring.length / 2;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = ring[2 * i] ?? 0;
    const zi = ring[2 * i + 1] ?? 0;
    const xj = ring[2 * j] ?? 0;
    const zj = ring[2 * j + 1] ?? 0;
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
};

/** Closest point of the ring boundary to (x, z) and its distance. */
export const closestOnRing = (ring: Float32Array, x: number, z: number): { x: number; z: number; distance: number } => {
  let best = { x, z, distance: Infinity };
  const n = ring.length / 2;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const ax = ring[2 * j] ?? 0;
    const az = ring[2 * j + 1] ?? 0;
    const bx = ring[2 * i] ?? 0;
    const bz = ring[2 * i + 1] ?? 0;
    const dx = bx - ax;
    const dz = bz - az;
    const len2 = dx * dx + dz * dz;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / len2));
    const px = ax + dx * t;
    const pz = az + dz * t;
    const d = Math.hypot(x - px, z - pz);
    if (d < best.distance) best = { x: px, z: pz, distance: d };
  }
  return best;
};

/** Moves a circle (centre, radius) out of a polygon; returns null when there is no overlap. */
export const pushCircleOut = (
  ring: Float32Array,
  x: number,
  z: number,
  radius: number,
): { x: number; z: number } | null => {
  const inside = pointInRing(ring, x, z);
  const c = closestOnRing(ring, x, z);
  if (!inside && c.distance >= radius) return null;
  const dx = x - c.x;
  const dz = z - c.z;
  const len = Math.hypot(dx, dz);
  // Inside: push through the nearest edge (direction from centre to the boundary point).
  const [nx, nz] = len < 1e-9 ? [1, 0] : inside ? [-dx / len, -dz / len] : [dx / len, dz / len];
  const margin = 1e-4;
  return { x: c.x + nx * (radius + margin), z: c.z + nz * (radius + margin) };
};
