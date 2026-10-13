/**
 * Role: tests stage 01-acquire with a fake downloader: download once, reuse the cache, refuse a snapshot whose sha256 differs from the lock.
 * Owner: backend
 */

import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createLogger } from '@skyline/observability';
import { parsePipelineConfig } from '../../config/load-pipeline-config.ts';
import { runPipeline } from '../../runner/run-pipeline.ts';
import type { DownloadFile } from '../../sources/download-file.ts';
import { createAcquireStage } from './acquire-stage.ts';

const PBF_BYTES = 'fake pbf content';
const logger = createLogger({ service: 'test', level: 'silent' });
let repoRoot = '';

const lock = (sha256: string) => ({
  osm: {
    provider: 'geofabrik',
    region: 'africa/ivory-coast',
    url: 'https://download.geofabrik.de/africa/ivory-coast-261001.osm.pbf',
    snapshotDate: '2026-10-01',
    fileName: 'ivory-coast-261001.osm.pbf',
    sizeBytes: PBF_BYTES.length,
    sha256,
    md5: '0'.repeat(32),
    licence: 'ODbL-1.0',
    attribution: '© OpenStreetMap contributors',
  },
  boundaries: {},
});

const config = parsePipelineConfig(
  {
    commune: 'unit',
    displayName: 'Unit',
    seed: 'v1',
    source: { kind: 'osm-snapshot', lockFile: 'sources.lock.json' },
    boundary: { osmRelationId: null, provisionalBboxLonLat: [-4.1, 5.3, -4.0, 5.4] },
    marginM: 0,
    outputDir: 'build',
  },
  'test',
);

const fakeDownload = (calls: string[]): DownloadFile => async (url, destination) => {
  calls.push(url);
  await mkdir(join(destination, '..'), { recursive: true });
  await writeFile(destination, PBF_BYTES);
};

const run = (stage: ReturnType<typeof createAcquireStage>) => runPipeline({ repoRoot, config, stages: [stage], logger });

beforeEach(async () => {
  repoRoot = await mkdtemp(join(tmpdir(), 'acquire-'));
  const sha = createHash('sha256').update(PBF_BYTES).digest('hex');
  await writeFile(join(repoRoot, 'sources.lock.json'), JSON.stringify(lock(sha)));
});
afterEach(async () => rm(repoRoot, { recursive: true, force: true }));

describe('01-acquire', () => {
  it('should download the snapshot once and then reuse the cache', async () => {
    const calls: string[] = [];
    expect((await run(createAcquireStage(fakeDownload(calls))))[0]?.status).toBe('ran');
    expect((await run(createAcquireStage(fakeDownload(calls))))[0]?.status).toBe('cached');
    expect(calls).toHaveLength(1);
  });

  it('should download again when the cached snapshot was deleted', async () => {
    const calls: string[] = [];
    await run(createAcquireStage(fakeDownload(calls)));
    await rm(join(repoRoot, 'data/cache/osm/ivory-coast-261001.osm.pbf'));
    expect((await run(createAcquireStage(fakeDownload(calls))))[0]?.status).toBe('ran');
    expect(calls).toHaveLength(2);
  });

  it('should fail with an explicit message when the cached file does not match the lock', async () => {
    await mkdir(join(repoRoot, 'data/cache/osm'), { recursive: true });
    await writeFile(join(repoRoot, 'data/cache/osm/ivory-coast-261001.osm.pbf'), 'corrupted');
    await expect(run(createAcquireStage(fakeDownload([])))).rejects.toThrow(/sources\.lock\.json expects/);
  });
});
