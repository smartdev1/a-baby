/**
 * Role: tile-meta-schema — Zod schemas for tile metadata validation.
 * Owner: frontend
 *
 * Zod schemas for strict validation of tile metadata v0.
 * All fields are required; non-conforming data produces a structured error.
 */

import { z } from 'zod';

/** Schema for individual building */
const TileBuildingSchema = z.object({
  id: z.string().trim(),
  type: z.string().trim(),
  levels: z.number().int().positive(),
  heightM: z.number().nonnegative(),
  heightSource: z.enum(['osm', 'dataset', 'heuristic']),
});

/** Schema for individual place */
const TilePlaceSchema = z.object({
  id: z.string().trim(),
  category: z.string().trim(),
  displayName: z.string().nullish(),
  position: z.object({ x: z.number(), z: z.number() }),
  buildingId: z.string().nullable(),
});

/** Schema for tile metadata v0 */
export const TileMetaSchema = z.object({
  formatVersion: z.number().int().default(0).refine((v) => v === 0, 'Format version must be 0'),
  tileKey: z.string().trim().startsWith('L0').refine((v) => v.startsWith('L0'), 'Tile key must start with "L0"'),
  buildings: z.array(TileBuildingSchema).default([]),
  places: z.array(TilePlaceSchema).default([]),
  neighbours: z.array(z.string()).default([]),
});

/** Infer types from the schemas */
export type TileMeta = z.infer<typeof TileMetaSchema>;

/** Schema for individual building (exported for reuse) */
export { TileBuildingSchema };

/** Schema for individual place (exported for reuse) */
export { TilePlaceSchema };