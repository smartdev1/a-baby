/**
 * Role: relief and water of one L0 tile: 51 × 51 heights every 5 m (shared edges with neighbours) and a 50 × 50 water cell mask with its level.
 * Owner: backend
 */

import { tileBounds } from '@skyline/geo';
import { waterMaskBytes } from '@skyline/tile-format';
import type { HeightGrid } from './height-grid.ts';
import type { WaterClassifier } from './water-classifier.ts';

export const TERRAIN_CELL_M = 5;
export const TERRAIN_RESOLUTION = 250 / TERRAIN_CELL_M + 1;
const CELLS = TERRAIN_RESOLUTION - 1;
/** Water bed below the water level, so shores slope into the water. */
const WATER_DEPTH_M = 1.5;

export interface TileTerrain {
  readonly key: string;
  readonly resolution: number;
  readonly cellSizeM: number;
  /** resolution² heights (cm precision), row-major, south → north. */
  readonly heightsM: number[];
  readonly water: { readonly levelM: number; readonly cellsPerSide: number; readonly maskBase64: string } | null;
}

const cm = (v: number): number => Math.round(v * 100) / 100;

interface WaterCells {
  readonly mask: Uint8Array;
  readonly heights: number[];
}

const classifyWaterCells = (origin: { e: number; n: number }, ground: HeightGrid, water: WaterClassifier): WaterCells => {
  const mask = new Uint8Array(waterMaskBytes(CELLS));
  const heights: number[] = [];
  for (let j = 0; j < CELLS; j++) {
    for (let i = 0; i < CELLS; i++) {
      const e = origin.e + (i + 0.5) * TERRAIN_CELL_M;
      const n = origin.n + (j + 0.5) * TERRAIN_CELL_M;
      if (!water.isWater(e, n)) continue;
      const k = j * CELLS + i;
      mask[k >> 3] = (mask[k >> 3] ?? 0) | (1 << (k & 7));
      heights.push(ground.sample(e, n));
    }
  }
  return { mask, heights };
};

const isWaterCellOf = (mask: Uint8Array) => (i: number, j: number): boolean => {
  if (i < 0 || j < 0 || i >= CELLS || j >= CELLS) return false;
  const k = j * CELLS + i;
  return ((mask[k >> 3] ?? 0) & (1 << (k & 7))) !== 0;
};

export const buildTileTerrain = (key: string, ground: HeightGrid, water: WaterClassifier): TileTerrain => {
  const b = tileBounds(key);
  const cells = classifyWaterCells({ e: b.minEastingM, n: b.minNorthingM }, ground, water);
  const levelM = cells.heights.length > 0 ? cm(Math.min(...cells.heights)) : 0;
  const isWaterCell = isWaterCellOf(cells.mask);
  const heightsM: number[] = [];
  for (let j = 0; j < TERRAIN_RESOLUTION; j++) {
    for (let i = 0; i < TERRAIN_RESOLUTION; i++) {
      const underWater = isWaterCell(i - 1, j - 1) && isWaterCell(i, j - 1) && isWaterCell(i - 1, j) && isWaterCell(i, j);
      const h = ground.sample(b.minEastingM + i * TERRAIN_CELL_M, b.minNorthingM + j * TERRAIN_CELL_M);
      heightsM.push(cm(underWater ? Math.min(h, levelM - WATER_DEPTH_M) : h));
    }
  }
  return {
    key,
    resolution: TERRAIN_RESOLUTION,
    cellSizeM: TERRAIN_CELL_M,
    heightsM,
    water: cells.heights.length > 0 ? { levelM, cellsPerSide: CELLS, maskBase64: Buffer.from(cells.mask).toString('base64') } : null,
  };
};
