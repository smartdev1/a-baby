/**
 * Role: tests the terrain building blocks: grid sampling, bare-ground filter, water side of coastlines and water polygons, road levelling, tile water mask.
 * Owner: backend
 */

import { tileBounds } from '@skyline/geo';
import { describe, expect, it } from 'vitest';
import { groundFromSurface } from './ground-filter.ts';
import { HeightGrid } from './height-grid.ts';
import { levelRoads } from './road-levelling.ts';
import { buildTileTerrain, TERRAIN_RESOLUTION } from './tile-terrain.ts';
import { WaterClassifier } from './water-classifier.ts';

const KEY = 'L0_325_199';
const B = tileBounds(KEY);

const slope = (): HeightGrid => {
  const g = HeightGrid.flat({ minE: B.minEastingM, minN: B.minNorthingM, cellM: 5, cols: 50, rows: 50 });
  for (let r = 0; r < 50; r++) for (let c = 0; c < 50; c++) g.set(c, r, r); // rises 1 m per 5 m northward
  return g;
};

describe('HeightGrid', () => {
  it('should sample bilinearly between cell centres', () => {
    const g = slope();
    const [e, n] = g.centre(10, 10);
    expect(g.sample(e, n)).toBeCloseTo(10, 6);
    expect(g.sample(e, n + 2.5)).toBeCloseTo(10.5, 6);
  });
});

describe('groundFromSurface', () => {
  it('should remove a 10 m building from the surface model and keep the slope', () => {
    const g = slope();
    for (let r = 20; r < 23; r++) for (let c = 20; c < 23; c++) g.set(c, r, g.get(c, r) + 10);
    const ground = groundFromSurface(g);
    expect(ground.get(21, 21)).toBeLessThan(21 + 1);
    expect(ground.get(21, 21)).toBeGreaterThan(14);
  });
});

describe('WaterClassifier', () => {
  it('should put water on the right of the coastline direction and inside water polygons', () => {
    // Coastline going east along y = 0: water on the right = south.
    const water = new WaterClassifier([[[0, 0], [100, 0]]], [[[[200, 200], [210, 200], [210, 210], [200, 210], [200, 200]]]]);
    expect(water.isWater(50, -10)).toBe(true);
    expect(water.isWater(50, 10)).toBe(false);
    expect(water.isWater(205, 205)).toBe(true);
    expect(new WaterClassifier([], []).isWater(0, 0)).toBe(false);
  });
});

describe('levelRoads', () => {
  it('should flatten the ground across a road and ignore bridges', () => {
    const g = slope();
    const across = (dz: number) => g.sample(B.minEastingM + 100, B.minNorthingM + 120 + dz);
    const n = B.minNorthingM + 120;
    const road = { geometry: [[B.minEastingM + 50, n], [B.minEastingM + 150, n]] as const, widthM: 6, layer: 0 };
    expect(levelRoads(g, [{ ...road, layer: 1 }])).toBe(0);
    expect(levelRoads(g, [road])).toBeGreaterThan(0);
    expect(Math.abs(across(2.5) - across(-2.5))).toBeLessThan(0.01);
  });
});

describe('buildTileTerrain', () => {
  it('should produce 51 × 51 heights and a water mask with its level', () => {
    const g = HeightGrid.flat({ minE: B.minEastingM - 100, minN: B.minNorthingM - 100, cellM: 5, cols: 100, rows: 100 });
    const water = new WaterClassifier([[[B.minEastingM - 10, B.minNorthingM + 125], [B.maxEastingM + 10, B.minNorthingM + 125]]], []);
    const t = buildTileTerrain(KEY, g, water);
    expect(t.heightsM).toHaveLength(TERRAIN_RESOLUTION * TERRAIN_RESOLUTION);
    expect(t.water?.cellsPerSide).toBe(50);
    const mask = Buffer.from(t.water?.maskBase64 ?? '', 'base64');
    const bit = (i: number, j: number) => ((mask[(j * 50 + i) >> 3] ?? 0) >> ((j * 50 + i) & 7)) & 1;
    expect(bit(10, 5)).toBe(1); // south half = water
    expect(bit(10, 40)).toBe(0);
    expect(t.heightsM[5 * TERRAIN_RESOLUTION + 10]).toBeLessThan(0); // lagoon bed under the water level
  });
});
