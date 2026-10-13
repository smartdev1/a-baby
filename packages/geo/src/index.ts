/**
 * Role: public API of @skyline/geo. Geographic reference: WGS84 <-> UTM 30N <-> local metres, TileKey/CellKey and grid maths.
 * Owner: backend
 */

export type { EnginePosition, LonLat, UtmBounds, UtmPosition } from './geo-types.ts';
export { fromUtm30n, toUtm30n } from './utm-projection.ts';
export {
  assertInsideGrid,
  generateSector,
  generateWorld,
  GRID_BOUNDS,
  GRID_ORIGIN,
  GRID_SIZE_M,
  isInsideGrid,
  normalizeToBounds,
  TILE_LEVELS,
  tileSizeM,
  type TileLevel,
} from './world-grid.ts';
export {
  childTileKeys,
  formatTileKey,
  parentTileKey,
  parseTileKey,
  tileBounds,
  tileCoordOf,
  tileKeyOf,
  type TileCoord,
  type TileKey,
} from './tile-keys.ts';
export {
  CELL_SIZE_IN_TILES,
  CELL_SIZE_M,
  cellBounds,
  cellKeyOf,
  parseCellKey,
  tilesOfCell,
  type CellKey,
} from './cell-keys.ts';
export { fromEngine, toEngine } from './engine-frame.ts';
