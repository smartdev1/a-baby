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
    collision: ContentHashSchema.optional(),
    meta: ContentHashSchema.optional(),
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
    /** ODbL: the OSM-derived database of the release and the attribution file, published next to the manifest. */
    osmDerived: z.object({ fileName: z.string().regex(/^osm-derived\.[a-z0-9-]+\.tar\.gz$/), sha256: z.string().regex(/^[0-9a-f]{64}$/), bytes: z.number().int().positive() }).strict().optional(),
    attributionFile: z.literal('ATTRIBUTION.md').optional(),
    tiles: z.record(TileKeySchema, ManifestTileSchema),
  })
  .strict()
  .superRefine((manifest, ctx) => {
    for (const [key, files] of Object.entries(manifest.tiles)) {
      // L0 tiles are playable (collision + meta); coarser levels are render-only (geom).
      const ok = key.startsWith('L0_') ? files.collision !== undefined && files.meta !== undefined : files.geom !== undefined;
      if (!ok) ctx.addIssue({ code: 'custom', path: ['tiles', key], message: key.startsWith('L0_') ? 'L0 tile needs collision and meta' : 'LOD tile needs geom' });
    }
  });

export type WorldManifest = z.infer<typeof WorldManifestSchema>;
export type ManifestTile = z.infer<typeof ManifestTileSchema>;
