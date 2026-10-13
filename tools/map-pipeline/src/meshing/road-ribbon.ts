/**
 * Role: turns clipped road centre lines into flat ribbons at the real width of their highway class (road surface vs paths).
 * Owner: backend
 */

import type { LocalPoint } from '../tiling/tile-content.ts';
import type { MeshBuffer } from './mesh-buffer.ts';

/** Carriageway width in metres per `highway` class (typical Abidjan values, refined with lanes later). */
const WIDTH_M: Readonly<Record<string, number>> = {
  motorway: 14,
  trunk: 12,
  primary: 10,
  secondary: 8,
  tertiary: 7,
  motorway_link: 6,
  trunk_link: 6,
  primary_link: 6,
  secondary_link: 6,
  tertiary_link: 5,
  residential: 5.5,
  unclassified: 5,
  living_street: 4.5,
  pedestrian: 4,
  service: 3.5,
  track: 3,
  footway: 1.5,
  path: 1.5,
  steps: 1.5,
  cycleway: 1.5,
};

const PATH_CLASSES = new Set(['footway', 'path', 'steps', 'cycleway', 'track', 'pedestrian']);

export const roadWidthM = (roadClass: string): number => WIDTH_M[roadClass] ?? 4;
export const isPathClass = (roadClass: string): boolean => PATH_CLASSES.has(roadClass);

/** Slightly above the ground to avoid z-fighting; paths above roads where they cross. */
const ROAD_Y_M = 0.05;
const PATH_Y_M = 0.07;

const sideNormal = (prev: LocalPoint, next: LocalPoint): [number, number] => {
  const dx = next[0] - prev[0];
  const dz = next[1] - prev[1];
  const len = Math.hypot(dx, dz) || 1;
  return [-dz / len, dx / len];
};

export const addRoadRibbon = (buffer: MeshBuffer, line: readonly LocalPoint[], roadClass: string): void => {
  if (line.length < 2) return;
  const half = roadWidthM(roadClass) / 2;
  const y = isPathClass(roadClass) ? PATH_Y_M : ROAD_Y_M;
  const base = buffer.vertexCount;
  line.forEach((p, k) => {
    const prev = line[Math.max(k - 1, 0)] ?? p;
    const next = line[Math.min(k + 1, line.length - 1)] ?? p;
    const [sx, sz] = sideNormal(prev, next);
    buffer.vertex([p[0] + sx * half, y, p[1] + sz * half], [0, 1, 0]);
    buffer.vertex([p[0] - sx * half, y, p[1] - sz * half], [0, 1, 0]);
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
