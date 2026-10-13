/**
 * Role: turns clipped road centre lines into flat ribbons at the real width of their highway class (widths from roads/road-classes.ts).
 * Owner: backend
 */

import { isPathClass, roadWidthM } from '../roads/road-classes.ts';
import type { LocalPoint } from '../tiling/tile-content.ts';
import type { MeshBuffer } from './mesh-buffer.ts';

/** Above the ground triangles (5 m grid vs bilinear draping) to avoid z-fighting; paths above roads where they cross. */
const ROAD_Y_M = 0.12;
const PATH_Y_M = 0.15;

const sideNormal = (prev: LocalPoint, next: LocalPoint): [number, number] => {
  const dx = next[0] - prev[0];
  const dz = next[1] - prev[1];
  const len = Math.hypot(dx, dz) || 1;
  return [-dz / len, dx / len];
};

/** Draped roads need vertices at least every few metres, otherwise the terrain shows through long straight segments. */
const MAX_DRAPE_STEP_M = 4;

export const densify = (line: readonly LocalPoint[], maxStepM = MAX_DRAPE_STEP_M): LocalPoint[] => {
  const out: LocalPoint[] = [];
  line.forEach((p, k) => {
    const prev = line[k - 1];
    if (prev) {
      const steps = Math.ceil(Math.hypot(p[0] - prev[0], p[1] - prev[1]) / maxStepM);
      for (let s = 1; s < steps; s++) out.push([prev[0] + ((p[0] - prev[0]) * s) / steps, prev[1] + ((p[1] - prev[1]) * s) / steps]);
    }
    out.push(p);
  });
  return out;
};

/** `groundAt(x, z)` gives the terrain height in tile-local metres (roads are draped on it). */
export const addRoadRibbon = (buffer: MeshBuffer, centreLine: readonly LocalPoint[], roadClass: string, groundAt: (x: number, z: number) => number = () => 0): void => {
  if (centreLine.length < 2) return;
  const line = densify(centreLine);
  const half = roadWidthM(roadClass) / 2;
  const y = isPathClass(roadClass) ? PATH_Y_M : ROAD_Y_M;
  const base = buffer.vertexCount;
  line.forEach((p, k) => {
    const prev = line[Math.max(k - 1, 0)] ?? p;
    const next = line[Math.min(k + 1, line.length - 1)] ?? p;
    const [sx, sz] = sideNormal(prev, next);
    const ground = groundAt(p[0], p[1]);
    buffer.vertex([p[0] + sx * half, ground + y, p[1] + sz * half], [0, 1, 0]);
    buffer.vertex([p[0] - sx * half, ground + y, p[1] - sz * half], [0, 1, 0]);
  });
  for (let k = 0; k < line.length - 1; k++) {
    const a = base + 2 * k;
    buffer.triangle(a, a + 1, a + 3);
    buffer.triangle(a, a + 3, a + 2);
  }
};

export const addGroundQuad = (buffer: MeshBuffer, sizeM: number): void => {
  const v = [
    buffer.vertex([0, 0, 0], [0, 1, 0]),
    buffer.vertex([sizeM, 0, 0], [0, 1, 0]),
    buffer.vertex([sizeM, 0, sizeM], [0, 1, 0]),
    buffer.vertex([0, 0, sizeM], [0, 1, 0]),
  ] as const;
  buffer.triangle(v[0], v[1], v[2]);
  buffer.triangle(v[0], v[2], v[3]);
};
