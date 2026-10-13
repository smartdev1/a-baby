/**
 * Role: stage 01-acquire: makes sure the frozen OSM snapshot of the sources lock is in data/cache/osm with the exact sha256 (downloads it once).
 * Owner: backend
 */

import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { PipelineStage, StageContext } from '../../runner/stage-contract.ts';
import { type DownloadFile, downloadFile } from '../../sources/download-file.ts';
import { ensureLockedFile } from '../../sources/ensure-locked-file.ts';
import { loadSourcesLock, loadSourcesLockSync, OSM_CACHE_DIR, type OsmSnapshotLock } from '../../sources/sources-lock.ts';

export const ACQUIRE_STAGE_ID = '01-acquire';
export const SNAPSHOT_DESCRIPTOR_FILE = 'snapshot.json';

const lockPath = (ctx: StageContext): string => {
  if (ctx.config.source.kind !== 'osm-snapshot') throw new Error('01-acquire needs an "osm-snapshot" source');
  return ctx.fromRepo(ctx.config.source.lockFile);
};

export const snapshotPath = (ctx: StageContext, lock: OsmSnapshotLock): string => ctx.fromRepo(`${OSM_CACHE_DIR}/${lock.fileName}`);

export const createAcquireStage = (download: DownloadFile = downloadFile): PipelineStage => ({
  id: ACQUIRE_STAGE_ID,
  version: 1,
  outputs: [SNAPSHOT_DESCRIPTOR_FILE],
  // The cached snapshot is an input when present: deleting or corrupting it invalidates this stage.
  inputFiles: (ctx) => {
    const lock = lockPath(ctx);
    const cached = snapshotPath(ctx, loadSourcesLockSync(lock).osm);
    return existsSync(cached) ? [lock, cached] : [lock];
  },
  params: (ctx) => ({ source: ctx.config.source }),
  run: async (ctx, outDir) => {
    const { osm } = await loadSourcesLock(lockPath(ctx));
    const target = snapshotPath(ctx, osm);
    if (!existsSync(target)) ctx.logger.info({ url: osm.url, sizeBytes: osm.sizeBytes }, 'downloading OSM snapshot');
    await ensureLockedFile(osm, target, download);
    const descriptor = { ...osm, cachedFile: `${OSM_CACHE_DIR}/${osm.fileName}` };
    await writeFile(join(outDir, SNAPSHOT_DESCRIPTOR_FILE), `${JSON.stringify(descriptor, null, 2)}\n`);
  },
});
