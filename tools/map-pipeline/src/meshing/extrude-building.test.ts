/**
 * Role: tests building extrusion: an L-shaped footprint keeps its exact vertices (no bounding box), holes are respected, tile-border walls are skipped.
 * Owner: backend
 */

import { describe, expect, it } from 'vitest';
import type { LocalPolygon } from '../tiling/tile-content.ts';
import { extrudeBuilding } from './extrude-building.ts';
import { MeshBuffer } from './mesh-buffer.ts';

const L_SHAPE: LocalPolygon = [[[10, 10], [40, 10], [40, 20], [20, 20], [20, 40], [10, 40], [10, 10]]];

const roofPoints = (roofs: MeshBuffer): [number, number][] => {
  const pts: [number, number][] = [];
  for (let k = 0; k < roofs.positions.length; k += 3) pts.push([roofs.positions[k] ?? 0, -(roofs.positions[k + 2] ?? 0)]);
  return pts;
};

describe('extrudeBuilding', () => {
  it('should follow the real L-shaped footprint (no bounding box)', () => {
    const walls = new MeshBuffer();
    const roofs = new MeshBuffer();
    extrudeBuilding([L_SHAPE], 9.5, walls, roofs);
    const expected = (L_SHAPE[0] ?? []).slice(0, -1);
    for (const p of roofPoints(roofs)) expect(expected.some(([x, z]) => Math.abs(x - p[0]) < 0.05 && Math.abs(z - p[1]) < 0.05)).toBe(true);
    expect(roofs.triangleCount).toBe(4); // 6 vertices → 4 triangles, the notch (30×20) is not covered
    expect(walls.triangleCount).toBe(12); // 6 walls × 2
    expect(Math.max(...roofs.positions.filter((_, k) => k % 3 === 1))).toBe(9.5);
  });

  it('should keep the courtyard of a building with a hole open', () => {
    const roofs = new MeshBuffer();
    const courtyard: LocalPolygon = [
      [[0, 0], [30, 0], [30, 30], [0, 30], [0, 0]].map(([x, z]) => [(x ?? 0) + 10, (z ?? 0) + 10] as const),
      [[10, 10], [20, 10], [20, 20], [10, 20], [10, 10]].map(([x, z]) => [(x ?? 0) + 10, (z ?? 0) + 10] as const),
    ];
    extrudeBuilding([courtyard], 6, new MeshBuffer(), roofs);
    expect(roofs.triangleCount).toBe(8);
  });

  it('should not build walls along the tile border', () => {
    const walls = new MeshBuffer();
    extrudeBuilding([[[[240, 10], [250, 10], [250, 20], [240, 20], [240, 10]]]], 3.5, walls, new MeshBuffer());
    expect(walls.triangleCount).toBe(6); // 3 walls, the one on x = 250 is skipped
  });
});
