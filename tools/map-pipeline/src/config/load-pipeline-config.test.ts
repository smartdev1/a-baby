/**
 * Role: tests that the committed commune configurations are valid and that invalid configurations are rejected.
 * Owner: backend
 */

import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadPipelineConfig, parsePipelineConfig, PipelineConfigError } from './load-pipeline-config.ts';

const configPath = (name: string): string => fileURLToPath(new URL(`../../config/${name}`, import.meta.url));

const VALID = {
  commune: 'test-commune',
  displayName: 'Test',
  seed: 'test-v1',
  source: { kind: 'local-file', format: 'geojson', path: 'tools/map-pipeline/test/fixtures/pigeons-sample.geojson', snapshotDate: '2026-10-13' },
  boundary: { osmRelationId: null },
  marginM: 0,
  outputDir: 'data/build/test-commune',
};

describe('committed pipeline configs', () => {
  it.each(['fixture.pipeline.json', 'yopougon.pipeline.json'])('should validate %s', async (name) => {
    const config = await loadPipelineConfig(configPath(name));
    expect(config.seed.length).toBeGreaterThan(0);
  });
});

describe('parsePipelineConfig', () => {
  it('should accept a valid config', () => {
    expect(parsePipelineConfig(VALID, 'test').commune).toBe('test-commune');
  });

  it.each([
    ['an absolute output path', { ...VALID, outputDir: '/tmp/out' }],
    ['a Windows separator', { ...VALID, outputDir: 'data\\build' }],
    ['an unknown key', { ...VALID, extra: true }],
    ['an upper-case commune', { ...VALID, commune: 'Yopougon' }],
    ['an unknown source kind', { ...VALID, source: { kind: 'overpass' } }],
  ])('should reject %s', (_label, raw) => {
    expect(() => parsePipelineConfig(raw, 'test')).toThrow(PipelineConfigError);
  });

  it('should reject a missing file with a readable error', async () => {
    await expect(loadPipelineConfig(configPath('missing.pipeline.json'))).rejects.toThrow(PipelineConfigError);
  });
});
