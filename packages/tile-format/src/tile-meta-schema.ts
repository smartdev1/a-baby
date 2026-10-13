/**
 * Role: Zod schema of `meta.{hash}.json` v0: buildings (OSM id, type, levels, height and its source), places (category, displayed name, position) and neighbour tiles.
 * Owner: backend
 */

import { z } from 'zod';
import { TILE_FORMAT_VERSION } from './format-version.ts';

export const TileKeySchema = z.string().regex(/^L[0-3]_\d+_\d+$/, 'expected a tile key L{level}_{i}_{j}');
export const OsmIdSchema = z.string().regex(/^osm:(node|way|relation)\/\d+$/, 'expected osm:{node|way|relation}/{id}');

/** Position in metres, local to the tile origin (south-west corner): x = east, z = north. */
const LocalPointSchema = z.object({ x: z.number().finite(), z: z.number().finite() });

export const HeightSourceSchema = z.enum(['osm', 'dataset', 'heuristic']);

export const TileBuildingSchema = z.object({
  id: OsmIdSchema,
  /** `building=*` value, normalized. */
  type: z.string().min(1),
  levels: z.number().int().min(1).max(200),
  heightM: z.number().positive().max(500),
  heightSource: HeightSourceSchema,
});

export const TilePlaceSchema = z.object({
  id: OsmIdSchema,
  /** Game category, e.g. `food.maquis`, `health.pharmacy`. */
  category: z.string().regex(/^[a-z_]+\.[a-z_]+$/),
  /** Name produced ONLY by the pipeline `naming` stage (real toponym or parodied brand), never raw OSM. */
  displayName: z.string().min(1).max(120).nullable(),
  position: LocalPointSchema,
  buildingId: OsmIdSchema.nullable(),
});

export const TileMetaSchema = z
  .object({
    formatVersion: z.literal(TILE_FORMAT_VERSION),
    tileKey: TileKeySchema,
    buildings: z.array(TileBuildingSchema),
    places: z.array(TilePlaceSchema),
    neighbours: z.array(TileKeySchema).max(8),
  })
  .strict();

export type TileBuilding = z.infer<typeof TileBuildingSchema>;
export type TilePlace = z.infer<typeof TilePlaceSchema>;
export type TileMeta = z.infer<typeof TileMetaSchema>;
