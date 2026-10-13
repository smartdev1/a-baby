/**
 * Role: Zod schema of a commune pipeline configuration (`config/<commune>.pipeline.json`): source, boundary, margin, seed, output, facade options.
 * Owner: backend
 */

import { z } from 'zod';

const RepoRelativePath = z
  .string()
  .min(1)
  .refine((p) => !p.startsWith('/') && !/^[A-Za-z]:/.test(p) && !p.includes('\\'), {
    message: 'must be a repository-relative path with "/" separators (Windows and Linux)',
  });

/** Local file source: a small GeoJSON extract used as golden fixture. */
const LocalFileSource = z.object({
  kind: z.literal('local-file'),
  format: z.literal('geojson'),
  path: RepoRelativePath,
  /** Date the extract was taken (written in the world manifest). */
  snapshotDate: z.iso.date(),
});

/** Frozen OSM snapshot described in a sources lock file (acquisition implemented in T-022). */
const OsmSnapshotSource = z.object({
  kind: z.literal('osm-snapshot'),
  lockFile: RepoRelativePath,
});

const BboxLonLat = z
  .tuple([z.number().min(-180).max(180), z.number().min(-90).max(90), z.number().min(-180).max(180), z.number().min(-90).max(90)])
  .refine(([west, south, east, north]) => west < east && south < north, 'bbox must be [west, south, east, north]');

export const PipelineConfigSchema = z
  .object({
    /** Machine name, lower-case kebab: `yopougon`. */
    commune: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    displayName: z.string().min(1),
    /** Seed of every random draw of the pipeline; changing it changes the generated world. */
    seed: z.string().min(1),
    source: z.discriminatedUnion('kind', [LocalFileSource, OsmSnapshotSource]),
    boundary: z.object({
      /** OSM relation of the administrative boundary; null until confirmed by spike SP2 (T-018). */
      osmRelationId: z.number().int().positive().nullable(),
      /** [west, south, east, north] in degrees, used while the relation is unknown. */
      provisionalBboxLonLat: BboxLonLat.nullable().default(null),
    }),
    /** Margin kept around the boundary, in metres. */
    marginM: z.number().min(0).max(5_000),
    /** Repository-relative build folder (git-ignored under data/build/). */
    outputDir: RepoRelativePath,
    facades: z
      .object({
        /** Leave the walls covered by facade bays out of geom.glb. Keep false until the client renders the facade kit (frontend J1-06). */
        stripBayWalls: z.boolean().default(false),
      })
      .strict()
      .default({ stripBayWalls: false }),
  })
  .strict()
  .refine((c) => c.source.kind !== 'osm-snapshot' || c.boundary.osmRelationId !== null || c.boundary.provisionalBboxLonLat !== null, {
    message: 'an osm-snapshot source needs boundary.osmRelationId or boundary.provisionalBboxLonLat',
    path: ['boundary'],
  });

export type PipelineConfig = z.infer<typeof PipelineConfigSchema>;
