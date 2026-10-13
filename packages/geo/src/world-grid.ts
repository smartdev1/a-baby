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

/** Normalizes a UTM position to the grid bounds (clamping if outside). */
export const normalizeToBounds = (position: UtmPosition): UtmPosition => {
  const clampedEasting = Math.max(
    GRID_BOUNDS.minEastingM,
    Math.min(position.eastingM, GRID_BOUNDS.maxEastingM - 0.001),
  );
  const clampedNorthing = Math.max(
    GRID_BOUNDS.minNorthingM,
    Math.min(position.northingM, GRID_BOUNDS.maxNorthingM - 0.001),
  );
  return { eastingM: clampedEasting, northingM: clampedNorthing };
};

/** Generates a sector tile key for a given position and LOD level.
 *  A sector groups 4×4 tiles at the given level, providing a coarser granularity.
 *  The sector key format is `S{level}_{i}_{j}` where i,j are sector coordinates.
 */
export const generateSector = (position: UtmPosition, level: TileLevel): `S${number}_${number}_${number}` => {
  assertInsideGrid(position);
  const size = tileSizeM(level);
  const sectorSize = size * 4; // 4 tiles per sector side
  const i = Math.floor((position.eastingM - GRID_ORIGIN.eastingM) / sectorSize);
  const j = Math.floor((position.northingM - GRID_ORIGIN.northingM) / sectorSize);
  return `S${level}_${i}_${j}` as `S${number}_${number}_${number}`;
};

/** Returns the world grid metadata: origin, extent, and available LOD levels. */
export const generateWorld = (): {
  origin: UtmPosition;
  bounds: UtmBounds;
  levels: readonly TileLevel[];
  defaultLevel: TileLevel;
} => ({
  origin: GRID_ORIGIN,
  bounds: GRID_BOUNDS,
  levels: TILE_LEVELS,
  defaultLevel: TILE_LEVELS[0],
});
