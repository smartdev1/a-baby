/**
 * Role: Zod schema of the release manifest `world-manifest.{release}.json`: an index (tile key → file hashes) with bbox, source snapshot and ODbL licence — no geometry.
 * Owner: backend
 */

import { z } from 'zod';
import { TILE_FORMAT_VERSION } from './format-version.ts';
import { TileKeySchema } from './tile-meta-schema.ts';

const ContentHashSchema = z.string().regex(/^[0-9a-f]{16}$/);

const ManifestTileSchema = z
  .object({
    geom: ContentHashSchema.optional(),
    instances: ContentHashSchema.optional(),
    collision: ContentHashSchema,
    meta: ContentHashSchema,
    nav: ContentHashSchema.optional(),
  })
  .strict();

export const WorldManifestSchema = z
  .object({
    formatVersion: z.literal(TILE_FORMAT_VERSION),
    release: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    commune: z.string().min(1),
    /** UTM 30N bounds of every tile of the release. */
    bboxUtm: z.object({
      minEastingM: z.number(),
      minNorthingM: z.number(),
      maxEastingM: z.number(),
      maxNorthingM: z.number(),
    }),
    sourceSnapshot: z.object({
      provider: z.string().min(1),
      fileName: z.string().min(1),
      snapshotDate: z.iso.date(),
      sha256: z.string().regex(/^[0-9a-f]{64}$/),
    }),
    licence: z.literal('ODbL-1.0'),
    attribution: z.string().min(1),
    tiles: z.record(TileKeySchema, ManifestTileSchema),
  })
  .strict();

export type WorldManifest = z.infer<typeof WorldManifestSchema>;
export type ManifestTile = z.infer<typeof ManifestTileSchema>;
