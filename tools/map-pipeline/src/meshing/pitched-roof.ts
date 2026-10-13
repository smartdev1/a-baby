/**
 * Role: meshes a corrugated sheet-metal roof over a building's oriented rectangle: two slopes and gable triangles (dual pitch) or one slope with its side triangles and back strip (mono pitch), with a 30 cm overhang.
 * Owner: backend
 */

import type { LocalPoint, TilePitchedRoof } from '../tiling/tile-content.ts';
import type { MeshBuffer, Vec3 } from './mesh-buffer.ts';

const OVERHANG_M = 0.3;

const ORIGIN: Vec3 = [0, 0, 0];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

/** Unit normal of a planar polygon, flipped to face `towards` (up for slopes, outwards for walls). */
const faceNormal = (p: readonly Vec3[], towards: Vec3): Vec3 => {
  const [a, b, c] = [p[0] ?? ORIGIN, p[1] ?? ORIGIN, p[2] ?? ORIGIN];
  const [u, v] = [sub(b, a), sub(c, a)];
  const n: Vec3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const len = Math.hypot(...n) || 1;
  const sign = n[0] * towards[0] + n[1] * towards[1] + n[2] * towards[2] < 0 ? -1 : 1;
  return [(sign * n[0]) / len, (sign * n[1]) / len, (sign * n[2]) / len];
};

/** Adds a convex planar polygon (triangle or quad) as a fan. */
const addFace = (buffer: MeshBuffer, points: readonly Vec3[], towards: Vec3): void => {
  const normal = faceNormal(points, towards);
  const ids = points.map((p) => buffer.vertex(p, normal));
  for (let k = 1; k + 1 < ids.length; k++) buffer.triangle(ids[0] ?? 0, ids[k] ?? 0, ids[k + 1] ?? 0);
};

const mid = (a: LocalPoint, b: LocalPoint): LocalPoint => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

/** Corners pushed outwards from the rectangle centre along both sides. */
const withOverhang = (corners: TilePitchedRoof['corners']): LocalPoint[] => {
  const [c0, c1, , c3] = corners;
  const len = (a: LocalPoint, b: LocalPoint): number => Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const u: LocalPoint = [(c1[0] - c0[0]) / len(c0, c1), (c1[1] - c0[1]) / len(c0, c1)];
  const v: LocalPoint = [(c3[0] - c0[0]) / len(c0, c3), (c3[1] - c0[1]) / len(c0, c3)];
  const signs: readonly (readonly [number, number])[] = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  return corners.map((c, k) => {
    const [su, sv] = signs[k] ?? [0, 0];
    return [c[0] + (su * u[0] + sv * v[0]) * OVERHANG_M, c[1] + (su * u[1] + sv * v[1]) * OVERHANG_M];
  });
};

const at = ([x, z]: LocalPoint, y: number): Vec3 => [x, y, z];

export const addPitchedRoof = (roof: TilePitchedRoof, topYM: number, { walls, sheetRoofs }: { walls: MeshBuffer; sheetRoofs: MeshBuffer }): void => {
  const [c0, c1, c2, c3] = roof.corners;
  const [o0, o1, o2, o3] = withOverhang(roof.corners) as [LocalPoint, LocalPoint, LocalPoint, LocalPoint];
  const up: Vec3 = [0, 1, 0];
  const top = topYM + roof.riseM;
  const centre = mid(c0, c2);
  const outwards = (p: LocalPoint): Vec3 => [p[0] - centre[0], 0, p[1] - centre[1]];
  if (roof.kind === 'sheet-gable') {
    const [r0, r1] = [mid(o3, o0), mid(o1, o2)];
    addFace(sheetRoofs, [at(o0, topYM), at(o1, topYM), at(r1, top), at(r0, top)], up);
    addFace(sheetRoofs, [at(o2, topYM), at(o3, topYM), at(r0, top), at(r1, top)], up);
    addFace(walls, [at(c1, topYM), at(c2, topYM), at(mid(c1, c2), top)], outwards(mid(c1, c2)));
    addFace(walls, [at(c3, topYM), at(c0, topYM), at(mid(c3, c0), top)], outwards(mid(c3, c0)));
    return;
  }
  addFace(sheetRoofs, [at(o0, topYM), at(o1, topYM), at(o2, top), at(o3, top)], up);
  addFace(walls, [at(c1, topYM), at(c2, topYM), at(c2, top)], outwards(mid(c1, c2)));
  addFace(walls, [at(c3, topYM), at(c0, topYM), at(c3, top)], outwards(mid(c3, c0)));
  addFace(walls, [at(c2, topYM), at(c3, topYM), at(c3, top), at(c2, top)], outwards(mid(c2, c3)));
};
