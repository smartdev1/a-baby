/**
 * Role: public API of @skyline/tile-format. Tile file format: meta/manifest schemas, collision.bin codec, tile file naming conventions.
 * Owner: backend
 */

export { TILE_FORMAT_VERSION } from './format-version.ts';
export {
  CONTENT_HASH_PATTERN,
  parseTileFileName,
  TILE_FILE_KINDS,
  tileDirectory,
  tileFileName,
  tileFilePath,
  worldManifestFileName,
  type TileFileKind,
} from './tile-file-names.ts';
export {
  HeightSourceSchema,
  OsmIdSchema,
  TileBuildingSchema,
  TileKeySchema,
  TileMetaSchema,
  TilePlaceSchema,
  type TileBuilding,
  type TileMeta,
  type TilePlace,
} from './tile-meta-schema.ts';
export { WorldManifestSchema, type ManifestTile, type WorldManifest } from './world-manifest-schema.ts';
export { parseTileMeta, parseWorldManifest, TileFormatError } from './parse-tile-json.ts';
export {
  COLLISION_LIMITS,
  COLLISION_MAGIC,
  COLLISION_VERSION,
  decodeCollision,
  encodeCollision,
  type CollisionData,
  type HeightField,
  type Prism,
} from './collision/collision-codec.ts';
export { CollisionDecodeError, type CollisionDecodeErrorCode } from './collision/bounded-reader.ts';
