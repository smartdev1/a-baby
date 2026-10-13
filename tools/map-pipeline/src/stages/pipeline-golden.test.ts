/**
 * Role: golden test of the pipeline on the Pigeons fixture: two runs give identical bytes, and outputs match the committed sha256 (UPDATE_GOLDEN=1 rewrites them on purpose).
 * Owner: backend
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { copyFile, cp, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createLogger } from '@skyline/observability';
import { loadPipelineConfig } from '../config/load-pipeline-config.ts';
import { sha256OfFile } from '../runner/content-hash.ts';
import { runPipeline } from '../runner/run-pipeline.ts';
import { stagesFor } from './stage-registry.ts';

const packageDir = fileURLToPath(new URL('../../', import.meta.url));
const GOLDEN_FILE = join(packageDir, 'test/golden/pigeons-fixture.sha256.json');
const FIXTURE = 'tools/map-pipeline/test/fixtures/pigeons-sample.geojson';
const CHECKED_OUTPUTS = [
  '04-normalize/normalized.ndjson',
  '05-classify/classified.ndjson',
  '06-heights/buildings.ndjson',
  '08-roads/road-edges.ndjson',
  '08-roads/road-stats.json',
  '09-naming/place-names.ndjson',
  '10-terrain/terrain-tiles.ndjson',
  '11-facades-roofs/facades.ndjson',
  '11-facades-roofs/roofs.ndjson',
  '12-props/props.ndjson',
  '14-tile-cut/tiles.ndjson',
  '15-lod-build/lod-index.json',
  '16-encode/encode-index.json',
  '17-manifest/world-manifest.pigeons-fixture-2026-10-13.json',
];
const logger = createLogger({ service: 'golden', level: 'silent' });

const roots: string[] = [];

const buildFixtureIn = async (): Promise<Record<string, string>> => {
  const root = await mkdtemp(join(tmpdir(), 'golden-'));
  roots.push(root);
  await mkdir(join(root, dirname(FIXTURE)), { recursive: true });
  await copyFile(join(packageDir, 'test/fixtures/pigeons-sample.geojson'), join(root, FIXTURE));
  await cp(join(packageDir, '../../content/place-names'), join(root, 'content/place-names'), { recursive: true });
  const config = await loadPipelineConfig(join(packageDir, 'config/fixture.pipeline.json'));
  await runPipeline({ repoRoot: root, config, stages: stagesFor(config), logger });
  const hashes: Record<string, string> = {};
  for (const output of CHECKED_OUTPUTS)
    hashes[output] = await sha256OfFile(join(root, config.outputDir, 'stages', output));
  return hashes;
};

let first: Record<string, string> = {};
let second: Record<string, string> = {};

beforeAll(async () => {
  first = await buildFixtureIn();
  second = await buildFixtureIn();
}, 60_000);
afterAll(async () => Promise.all(roots.map((r) => rm(r, { recursive: true, force: true }))));

describe('pipeline golden (Pigeons fixture)', () => {
  it('should produce identical bytes on two independent runs', () => {
    expect(second).toEqual(first);
  });

  it('should match the committed golden hashes', () => {
    if (process.env['UPDATE_GOLDEN'] === '1' || !existsSync(GOLDEN_FILE)) {
      writeFileSync(GOLDEN_FILE, `${JSON.stringify(first, null, 2)}\n`);
    }
    const golden = JSON.parse(readFileSync(GOLDEN_FILE, 'utf8')) as Record<string, string>;
    expect(first, 'outputs changed: if intended, run UPDATE_GOLDEN=1 pnpm test and bump the stage version').toEqual(
      golden,
    );
  });
});
