/**
 * Role: schema and loader of `data/sources/sources.lock.json`, the versioned description of the frozen OSM snapshot (URL, date, sha256, licence).
 * Owner: backend
 */

import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { z } from 'zod';

const Sha256 = z.string().regex(/^[0-9a-f]{64}$/);

export const OsmSnapshotLockSchema = z.object({
  provider: z.literal('geofabrik'),
  region: z.string().min(1),
  url: z.url().refine((u) => u.startsWith('https://download.geofabrik.de/'), 'must be a Geofabrik download URL'),
  snapshotDate: z.iso.date(),
  fileName: z.string().regex(/^[a-z0-9-]+\.osm\.pbf$/),
  sizeBytes: z.number().int().positive(),
  sha256: Sha256,
  md5: z.string().regex(/^[0-9a-f]{32}$/),
  licence: z.literal('ODbL-1.0'),
  attribution: z.string().min(1),
});

export const SourcesLockSchema = z.object({
  osm: OsmSnapshotLockSchema,
  boundaries: z.record(
    z.string(),
    z.object({ osmRelationId: z.number().int().positive().nullable(), note: z.string().optional() }),
  ),
});

export type OsmSnapshotLock = z.infer<typeof OsmSnapshotLockSchema>;
export type SourcesLock = z.infer<typeof SourcesLockSchema>;

const parseSourcesLock = (text: string, absolutePath: string): SourcesLock => {
  const result = SourcesLockSchema.safeParse(JSON.parse(text));
  if (!result.success) throw new Error(`invalid sources lock ${absolutePath}:\n${z.prettifyError(result.error)}`);
  return result.data;
};

export const loadSourcesLock = async (absolutePath: string): Promise<SourcesLock> =>
  parseSourcesLock(await readFile(absolutePath, 'utf8'), absolutePath);

/** Synchronous variant for stage input declarations. */
export const loadSourcesLockSync = (absolutePath: string): SourcesLock =>
  parseSourcesLock(readFileSync(absolutePath, 'utf8'), absolutePath);

/** Repository-relative folder where downloaded snapshots are cached (git-ignored). */
export const OSM_CACHE_DIR = 'data/cache/osm';
