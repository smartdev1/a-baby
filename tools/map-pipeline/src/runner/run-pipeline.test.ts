/**
 * Role: tests the incremental runner: first run, cache hit, invalidation on input / params / version / missing output, forced run, forced run from a stage.
 * Owner: backend
 */

import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createLogger } from '@skyline/observability';
import { parsePipelineConfig } from '../config/load-pipeline-config.ts';
import { sourceStage } from '../stages/01-source/source-stage.ts';
import { runPipeline } from './run-pipeline.ts';
import type { PipelineStage } from './stage-contract.ts';

const logger = createLogger({ service: 'test', level: 'silent' });
let repoRoot = '';

const config = (seed = 'v1') =>
  parsePipelineConfig(
    {
      commune: 'unit',
      displayName: 'Unit',
      seed,
      source: { kind: 'local-file', format: 'geojson', path: 'input.geojson', snapshotDate: '2026-10-13' },
      boundary: { osmRelationId: null },
      marginM: 0,
      outputDir: 'build',
    },
    'test',
  );

/** A second stage reading 01-source's output, counting its own runs. */
const countingStage = (counter: { runs: number }, version = 1): PipelineStage => ({
  id: '02-count',
  version,
  outputs: ['count.json'],
  inputFiles: (ctx) => [ctx.outputOf('01-source', 'source.geojson')],
  params: (ctx) => ({ seed: ctx.config.seed }),
  run: async (ctx, outDir) => {
    counter.runs++;
    const text = await readFile(ctx.outputOf('01-source', 'source.geojson'), 'utf8');
    await writeFile(join(outDir, 'count.json'), JSON.stringify({ bytes: text.length }));
  },
});

const statuses = async (stages: PipelineStage[], seed = 'v1', force = false) =>
  (await runPipeline({ repoRoot, config: config(seed), stages, logger, force })).map((r) => r.status);

beforeEach(async () => {
  repoRoot = await mkdtemp(join(tmpdir(), 'map-pipeline-'));
  await writeFile(join(repoRoot, 'input.geojson'), '{"type":"FeatureCollection","features":[]}');
});
afterEach(async () => rm(repoRoot, { recursive: true, force: true }));

describe('runPipeline', () => {
  it('should run every stage the first time and skip them the second time', async () => {
    const counter = { runs: 0 };
    expect(await statuses([sourceStage, countingStage(counter)])).toEqual(['ran', 'ran']);
    expect(await statuses([sourceStage, countingStage(counter)])).toEqual(['cached', 'cached']);
    expect(counter.runs).toBe(1);
  });

  it('should re-run downstream stages when the source file changes', async () => {
    const counter = { runs: 0 };
    await statuses([sourceStage, countingStage(counter)]);
    await writeFile(join(repoRoot, 'input.geojson'), '{"type":"FeatureCollection","features":[{}]}');
    expect(await statuses([sourceStage, countingStage(counter)])).toEqual(['ran', 'ran']);
  });

  it('should re-run a stage when its params or its version change', async () => {
    const counter = { runs: 0 };
    await statuses([sourceStage, countingStage(counter)]);
    expect(await statuses([sourceStage, countingStage(counter)], 'v2')).toEqual(['cached', 'ran']);
    expect(await statuses([sourceStage, countingStage(counter, 2)], 'v2')).toEqual(['cached', 'ran']);
  });

  it('should re-run a stage when one of its outputs was deleted or modified', async () => {
    const counter = { runs: 0 };
    await statuses([sourceStage, countingStage(counter)]);
    await writeFile(join(repoRoot, 'build/stages/02-count/count.json'), 'tampered');
    expect(await statuses([sourceStage, countingStage(counter)])).toEqual(['cached', 'ran']);
  });

  it('should re-run everything when forced', async () => {
    const counter = { runs: 0 };
    await statuses([sourceStage, countingStage(counter)]);
    expect(await statuses([sourceStage, countingStage(counter)], 'v1', true)).toEqual(['ran', 'ran']);
  });

  it('should re-run only from the given stage with forceFrom, and refuse an unknown stage', async () => {
    const counter = { runs: 0 };
    const stages = [sourceStage, countingStage(counter)];
    await statuses(stages);
    const reports = await runPipeline({ repoRoot, config: config(), stages, logger, forceFrom: '02-count' });
    expect(reports.map((r) => r.status)).toEqual(['cached', 'ran']);
    await expect(runPipeline({ repoRoot, config: config(), stages, logger, forceFrom: '99-nope' })).rejects.toThrow(/unknown stage/);
  });

  it('should fail when a stage does not write a declared output', async () => {
    const lazy: PipelineStage = { ...countingStage({ runs: 0 }), run: async () => {} };
    await expect(runPipeline({ repoRoot, config: config(), stages: [sourceStage, lazy], logger })).rejects.toThrow(
      /did not write its declared output/,
    );
  });
});
