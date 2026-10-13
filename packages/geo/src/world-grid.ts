/**
 * Role: fixed world grid of the Abidjan District: constant UTM origin, extent and tile sizes per LOD level (ADR 0002).
 * Owner: backend
 */

import type { UtmBounds, UtmPosition } from './geo-types.ts';

/**
 * South-west corner of the grid, rounded to the kilometre, with a margin around the Abidjan District
 * (≈ 4.70° W / 5.00° N → E 311 520, N 552 908). NEVER change it: every tile and cell id depends on it.
 */
export const GRID_ORIGIN: UtmPosition = { eastingM: 300_000, northingM: 540_000 };

/** Grid extent: 160 km east × 120 km north (covers the District up to ≈ 3.55° W / 5.95° N). */
export const GRID_SIZE_M = { eastM: 160_000, northM: 120_000 } as const;

export const GRID_BOUNDS: UtmBounds = {
  minEastingM: GRID_ORIGIN.eastingM,
  minNorthingM: GRID_ORIGIN.northingM,
  maxEastingM: GRID_ORIGIN.eastingM + GRID_SIZE_M.eastM,
  maxNorthingM: GRID_ORIGIN.northingM + GRID_SIZE_M.northM,
};

/** LOD levels: L0 250 m, L1 500 m, L2 1 km, L3 2 km. */
export const TILE_LEVELS = [0, 1, 2, 3] as const;
export type TileLevel = (typeof TILE_LEVELS)[number];

const L0_TILE_SIZE_M = 250;

export const tileSizeM = (level: TileLevel): number => L0_TILE_SIZE_M * 2 ** level;

export const isInsideGrid = ({ eastingM, northingM }: UtmPosition): boolean =>
  eastingM >= GRID_BOUNDS.minEastingM &&
  eastingM < GRID_BOUNDS.maxEastingM &&
  northingM >= GRID_BOUNDS.minNorthingM &&
  northingM < GRID_BOUNDS.maxNorthingM;

export const assertInsideGrid = (position: UtmPosition): void => {
  if (!isInsideGrid(position)) {
    throw new RangeError(`position E ${position.eastingM} N ${position.northingM} is outside the Abidjan world grid`);
  }
};
