/**
 * Role: tile keys `L{level}_{i}_{j}` on the fixed grid: position → key, key → bounds, key parsing and parent/children links.
 * Owner: backend
 */

import type { UtmBounds, UtmPosition } from './geo-types.ts';
import { assertInsideGrid, GRID_ORIGIN, TILE_LEVELS, type TileLevel, tileSizeM } from './world-grid.ts';

export interface TileCoord {
  readonly level: TileLevel;
  /** Column index, eastward from the grid origin. */
  readonly i: number;
  /** Row index, northward from the grid origin. */
  readonly j: number;
}

export type TileKey = `L${TileLevel}_${number}_${number}`;

const TILE_KEY_PATTERN = /^L([0-3])_(\d+)_(\d+)$/;

export const formatTileKey = ({ level, i, j }: TileCoord): TileKey => `L${level}_${i}_${j}`;

export const parseTileKey = (key: string): TileCoord => {
  const match = TILE_KEY_PATTERN.exec(key);
  if (!match) throw new SyntaxError(`invalid tile key "${key}"`);
  const level = Number(match[1]);
  if (!TILE_LEVELS.includes(level as TileLevel)) throw new SyntaxError(`invalid tile level in "${key}"`);
  return { level: level as TileLevel, i: Number(match[2]), j: Number(match[3]) };
};

export const tileCoordOf = (position: UtmPosition, level: TileLevel): TileCoord => {
  assertInsideGrid(position);
  const size = tileSizeM(level);
  return {
    level,
    i: Math.floor((position.eastingM - GRID_ORIGIN.eastingM) / size),
    j: Math.floor((position.northingM - GRID_ORIGIN.northingM) / size),
  };
};

export const tileKeyOf = (position: UtmPosition, level: TileLevel): TileKey => formatTileKey(tileCoordOf(position, level));

export const tileBounds = (key: string): UtmBounds => {
  const { level, i, j } = parseTileKey(key);
  const size = tileSizeM(level);
  const minEastingM = GRID_ORIGIN.eastingM + i * size;
  const minNorthingM = GRID_ORIGIN.northingM + j * size;
  return { minEastingM, minNorthingM, maxEastingM: minEastingM + size, maxNorthingM: minNorthingM + size };
};

/** Tile of the next coarser level that contains this tile (L0 → L1 …). */
export const parentTileKey = (key: string): TileKey | null => {
  const { level, i, j } = parseTileKey(key);
  if (level === 3) return null;
  return formatTileKey({ level: (level + 1) as TileLevel, i: Math.floor(i / 2), j: Math.floor(j / 2) });
};

/** The 4 tiles of the next finer level covering this tile. */
export const childTileKeys = (key: string): TileKey[] => {
  const { level, i, j } = parseTileKey(key);
  if (level === 0) return [];
  const childLevel = (level - 1) as TileLevel;
  return [0, 1].flatMap((dj) => [0, 1].map((di) => formatTileKey({ level: childLevel, i: 2 * i + di, j: 2 * j + dj })));
};
