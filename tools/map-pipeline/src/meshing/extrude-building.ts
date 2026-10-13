/**
 * Role: extrudes a clipped building footprint into a flat roof (earcut, holes supported) and outward-facing walls, skipping artificial walls along tile borders.
 * Owner: backend
 */

import earcut from 'earcut';
import type { LocalPoint, LocalPolygon } from '../tiling/tile-content.ts';
import { TILE_SIZE_M } from '../tiling/tile-frame.ts';
import type { MeshBuffer } from './mesh-buffer.ts';

const BORDER_EPSILON_M = 0.01;

/** Ring without its closing point. */
const openRing = (ring: readonly LocalPoint[]): LocalPoint[] => {
  const first = ring[0];
  const last = ring[ring.length - 1];
  return first && last && first[0] === last[0] && first[1] === last[1] ? ring.slice(0, -1) : [...ring];
};

const signedArea = (ring: readonly LocalPoint[]): number => {
  let twice = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[j];
    const b = ring[i];
    if (a && b) twice += a[0] * b[1] - b[0] * a[1];
  }
  return twice / 2;
};

/** Outer ring counter-clockwise, holes clockwise (x east, z north): the outward normal of edge a→b is then (dz, -dx). */
const orient = (ring: LocalPoint[], counterClockwise: boolean): LocalPoint[] => (signedArea(ring) > 0 === counterClockwise ? ring : ring.reverse());

const onSameBorder = (a: LocalPoint, b: LocalPoint): boolean =>
  [0, TILE_SIZE_M].some((edge) => (Math.abs(a[0] - edge) < BORDER_EPSILON_M && Math.abs(b[0] - edge) < BORDER_EPSILON_M) || (Math.abs(a[1] - edge) < BORDER_EPSILON_M && Math.abs(b[1] - edge) < BORDER_EPSILON_M));

const addWalls = (walls: MeshBuffer, ring: readonly LocalPoint[], [baseYM, topYM]: readonly [number, number]): void => {
  for (let k = 0; k < ring.length; k++) {
    const a = ring[k];
    const b = ring[(k + 1) % ring.length];
    if (!a || !b || onSameBorder(a, b)) continue;
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const len = Math.hypot(dx, dz);
    if (len < 1e-6) continue;
    const [nx, nz] = [dz / len, -dx / len];
    const v0 = walls.vertex([a[0], baseYM, a[1]], [nx, 0, nz]);
    const v1 = walls.vertex([b[0], baseYM, b[1]], [nx, 0, nz]);
    const v2 = walls.vertex([b[0], topYM, b[1]], [nx, 0, nz]);
    const v3 = walls.vertex([a[0], topYM, a[1]], [nx, 0, nz]);
    walls.triangle(v0, v1, v2);
    walls.triangle(v0, v2, v3);
  }
};

const addRoof = (roofs: MeshBuffer, rings: readonly LocalPoint[][], heightM: number): void => {
  const flat: number[] = [];
  const holes: number[] = [];
  rings.forEach((ring, index) => {
    if (index > 0) holes.push(flat.length / 2);
    for (const [x, z] of ring) flat.push(x, z);
  });
  const triangles = earcut(flat, holes, 2);
  const base = roofs.vertexCount;
  for (let k = 0; k < flat.length; k += 2) roofs.vertex([flat[k] ?? 0, heightM, flat[k + 1] ?? 0], [0, 1, 0]);
  for (let k = 0; k < triangles.length; k += 3) roofs.triangle(base + (triangles[k] ?? 0), base + (triangles[k + 1] ?? 0), base + (triangles[k + 2] ?? 0));
};

export interface BuildingVolume {
  readonly polygons: readonly LocalPolygon[];
  /** Ground under the building and building height (roof at baseYM + heightM). */
  readonly baseYM: number;
  readonly heightM: number;
}

export const extrudeBuilding = ({ polygons, baseYM, heightM }: BuildingVolume, { walls, roofs }: { walls: MeshBuffer; roofs: MeshBuffer }): void => {
  const topYM = baseYM + heightM;
  for (const polygon of polygons) {
    const rings = polygon.map(openRing).filter((r) => r.length >= 3);
    const [outer, ...holes] = rings;
    if (!outer) continue;
    const oriented = [orient(outer, true), ...holes.map((h) => orient(h, false))];
    oriented.forEach((ring) => addWalls(walls, ring, [baseYM, topYM]));
    addRoof(roofs, oriented, topYM);
  }
};
