/**
 * Role: Zod schema of a commune pipeline configuration (`config/<commune>.pipeline.json`): source, boundary, margin, seed, output.
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
});

/** Frozen OSM snapshot described in a sources lock file (acquisition implemented in T-022). */
const OsmSnapshotSource = z.object({
  kind: z.literal('osm-snapshot'),
  lockFile: RepoRelativePath,
});

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
    }),
    /** Margin kept around the boundary, in metres. */
    marginM: z.number().min(0).max(5_000),
    /** Repository-relative build folder (git-ignored under data/build/). */
    outputDir: RepoRelativePath,
  })
  .strict();

export type PipelineConfig = z.infer<typeof PipelineConfigSchema>;
