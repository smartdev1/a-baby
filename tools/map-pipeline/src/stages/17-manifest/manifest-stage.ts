/**
 * Role: stage 17-manifest: writes world-manifest.{release}.json (tile key → hashes, UTM bbox, source snapshot, ODbL licence), validated by @skyline/tile-format — no local path, no machine name.
 * Owner: backend
 */

import { readFile, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { tileBounds } from '@skyline/geo';
import { parseWorldManifest, TILE_FORMAT_VERSION, worldManifestFileName } from '@skyline/tile-format';
import { sha256OfFile } from '../../runner/content-hash.ts';
import type { PipelineStage, StageContext } from '../../runner/stage-contract.ts';
import { loadSourcesLockSync } from '../../sources/sources-lock.ts';
import { ENCODE_INDEX_FILE, ENCODE_STAGE_ID, type EncodeIndex } from '../16-encode/encode-stage.ts';

export const MANIFEST_STAGE_ID = '17-manifest';

interface SnapshotInfo {
  provider: string;
  fileName: string;
  snapshotDate: string;
  sha256: string;
}

const snapshotInfo = async (ctx: StageContext): Promise<SnapshotInfo> => {
  const { source } = ctx.config;
  if (source.kind === 'osm-snapshot') {
    const { osm } = loadSourcesLockSync(ctx.fromRepo(source.lockFile));
    return { provider: osm.provider, fileName: osm.fileName, snapshotDate: osm.snapshotDate, sha256: osm.sha256 };
  }
  return { provider: 'local-file', fileName: basename(source.path), snapshotDate: source.snapshotDate, sha256: await sha256OfFile(ctx.fromRepo(source.path)) };
};

const snapshotDateOf = (ctx: StageContext): string => {
  const { source } = ctx.config;
  return source.kind === 'osm-snapshot' ? loadSourcesLockSync(ctx.fromRepo(source.lockFile)).osm.snapshotDate : source.snapshotDate;
};

export const releaseName = (ctx: StageContext): string => `${ctx.config.commune}-${snapshotDateOf(ctx)}`;

const bboxOfTiles = (keys: string[]) => {
  const bounds = keys.map(tileBounds);
  return {
    minEastingM: Math.min(...bounds.map((b) => b.minEastingM)),
    minNorthingM: Math.min(...bounds.map((b) => b.minNorthingM)),
    maxEastingM: Math.max(...bounds.map((b) => b.maxEastingM)),
    maxNorthingM: Math.max(...bounds.map((b) => b.maxNorthingM)),
  };
};

export const manifestStage: PipelineStage = {
  id: MANIFEST_STAGE_ID,
  version: 1,
  outputs: (ctx) => [worldManifestFileName(releaseName(ctx))],
  inputFiles: (ctx) => [ctx.outputOf(ENCODE_STAGE_ID, ENCODE_INDEX_FILE)],
  params: (ctx) => ({ release: releaseName(ctx), commune: ctx.config.displayName, source: ctx.config.source }),
  run: async (ctx, outDir) => {
    const index = JSON.parse(await readFile(ctx.outputOf(ENCODE_STAGE_ID, ENCODE_INDEX_FILE), 'utf8')) as EncodeIndex;
    const keys = Object.keys(index);
    const manifest = parseWorldManifest({
      formatVersion: TILE_FORMAT_VERSION,
      release: releaseName(ctx),
      commune: ctx.config.displayName,
      bboxUtm: bboxOfTiles(keys),
      sourceSnapshot: await snapshotInfo(ctx),
      licence: 'ODbL-1.0',
      attribution: '© OpenStreetMap contributors',
      tiles: Object.fromEntries(keys.map((k) => [k, { geom: index[k]?.geom, collision: index[k]?.collision, meta: index[k]?.meta }])),
    });
    await writeFile(join(outDir, worldManifestFileName(manifest.release)), `${JSON.stringify(manifest, null, 2)}\n`);
    ctx.logger.info({ release: manifest.release, tiles: keys.length }, 'world manifest written');
  },
};
