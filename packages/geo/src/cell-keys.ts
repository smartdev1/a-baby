/**
 * Role: server cell keys `C_{i}_{j}`: a cell groups 4×4 L0 tiles (1 km²) and is always aligned on the tile grid.
 * Owner: backend
 */

import type { UtmBounds, UtmPosition } from './geo-types.ts';
import { formatTileKey, type TileKey } from './tile-keys.ts';
import { assertInsideGrid, GRID_ORIGIN, tileSizeM } from './world-grid.ts';

/** Default cell size in L0 tiles per side (4 × 250 m = 1 km). */
export const CELL_SIZE_IN_TILES = 4;
export const CELL_SIZE_M = CELL_SIZE_IN_TILES * tileSizeM(0);

export type CellKey = `C_${number}_${number}`;

const CELL_KEY_PATTERN = /^C_(\d+)_(\d+)$/;

export const parseCellKey = (key: string): { i: number; j: number } => {
  const match = CELL_KEY_PATTERN.exec(key);
  if (!match) throw new SyntaxError(`invalid cell key "${key}"`);
  return { i: Number(match[1]), j: Number(match[2]) };
};

export const cellKeyOf = (position: UtmPosition): CellKey => {
  assertInsideGrid(position);
  const i = Math.floor((position.eastingM - GRID_ORIGIN.eastingM) / CELL_SIZE_M);
  const j = Math.floor((position.northingM - GRID_ORIGIN.northingM) / CELL_SIZE_M);
  return `C_${i}_${j}`;
};

export const cellBounds = (key: string): UtmBounds => {
  const { i, j } = parseCellKey(key);
  const minEastingM = GRID_ORIGIN.eastingM + i * CELL_SIZE_M;
  const minNorthingM = GRID_ORIGIN.northingM + j * CELL_SIZE_M;
  return { minEastingM, minNorthingM, maxEastingM: minEastingM + CELL_SIZE_M, maxNorthingM: minNorthingM + CELL_SIZE_M };
};

/** The L0 tiles owned by a cell, south-west first, row by row. */
export const tilesOfCell = (key: string): TileKey[] => {
  const { i, j } = parseCellKey(key);
  const keys: TileKey[] = [];
  for (let dj = 0; dj < CELL_SIZE_IN_TILES; dj++) {
    for (let di = 0; di < CELL_SIZE_IN_TILES; di++) {
      keys.push(formatTileKey({ level: 0, i: i * CELL_SIZE_IN_TILES + di, j: j * CELL_SIZE_IN_TILES + dj }));
    }
  }
  return keys;
};
