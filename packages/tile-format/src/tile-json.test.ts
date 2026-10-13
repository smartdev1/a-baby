/**
 * Role: tests the tile meta and world manifest schemas (valid documents accepted, invalid ones rejected with readable paths) and the file naming helpers.
 * Owner: backend
 */

import { describe, expect, it } from 'vitest';
import { parseTileMeta, parseWorldManifest, TileFormatError } from './parse-tile-json.ts';
import { parseTileFileName, tileDirectory, tileFilePath, worldManifestFileName } from './tile-file-names.ts';

const META = {
  formatVersion: 1,
  tileKey: 'L0_325_199',
  buildings: [{ id: 'osm:way/558265139', type: 'apartments', levels: 4, heightM: 12.5, heightSource: 'heuristic' }],
  places: [{ id: 'osm:node/42', category: 'food.maquis', displayName: 'Maquis Le Pigeon', position: { x: 12, z: 80 }, buildingId: null }],
  neighbours: ['L0_324_199', 'L0_326_199'],
};

const MANIFEST = {
  formatVersion: 1,
  release: 'yopougon-2026-10-01',
  commune: 'Yopougon',
  bboxUtm: { minEastingM: 371_000, minNorthingM: 578_500, maxEastingM: 384_000, maxNorthingM: 597_000 },
  sourceSnapshot: { provider: 'geofabrik', fileName: 'ivory-coast-261001.osm.pbf', snapshotDate: '2026-10-01', sha256: 'a'.repeat(64) },
  licence: 'ODbL-1.0',
  attribution: '© OpenStreetMap contributors',
  tiles: { L0_325_199: { collision: '0123456789abcdef', meta: 'fedcba9876543210' } },
};

describe('tile JSON schemas', () => {
  it('should accept valid meta and manifest', () => {
    expect(parseTileMeta(META).buildings).toHaveLength(1);
    expect(parseWorldManifest(MANIFEST).tiles['L0_325_199']?.collision).toBe('0123456789abcdef');
  });

  it('should reject an invalid meta with the failing path in the message', () => {
    const bad = { ...META, buildings: [{ ...META.buildings[0], heightSource: 'guess' }] };
    expect(() => parseTileMeta(bad)).toThrow(TileFormatError);
    expect(() => parseTileMeta(bad)).toThrow(/buildings\[0\]\.heightSource|buildings\.0\.heightSource/);
  });

  it.each([
    ['another format version', { ...META, formatVersion: 0 }],
    ['an unknown key', { ...META, extra: 1 }],
    ['a raw OSM id', { ...META, places: [{ ...META.places[0], id: '42' }] }],
  ])('should reject a meta with %s', (_label, value) => {
    expect(() => parseTileMeta(value)).toThrow(TileFormatError);
  });

  it('should require collision and meta for L0 tiles and geom for LOD tiles', () => {
    expect(() => parseWorldManifest({ ...MANIFEST, tiles: { L0_1_1: { geom: '0123456789abcdef' } } })).toThrow(TileFormatError);
    expect(parseWorldManifest({ ...MANIFEST, tiles: { L1_1_1: { geom: '0123456789abcdef' } } }).tiles['L1_1_1']?.geom).toBe('0123456789abcdef');
    expect(() => parseWorldManifest({ ...MANIFEST, tiles: { L1_1_1: {} } })).toThrow(TileFormatError);
  });

  it('should reject a manifest whose licence is not ODbL', () => {
    expect(() => parseWorldManifest({ ...MANIFEST, licence: 'CC0' })).toThrow(TileFormatError);
  });
});

describe('tile file names', () => {
  it('should build and parse tile paths', () => {
    expect(tileDirectory('L0_325_199')).toBe('tiles/L0/325_199');
    expect(tileFilePath('L0_325_199', 'collision', '0123456789abcdef')).toBe('tiles/L0/325_199/collision.0123456789abcdef.bin');
    expect(parseTileFileName('meta.0123456789abcdef.json')).toEqual({ kind: 'meta', hash: '0123456789abcdef' });
    expect(worldManifestFileName('yopougon-2026-10-01')).toBe('world-manifest.yopougon-2026-10-01.json');
  });

  it.each(['meta.0123456789abcdef.bin', 'roof.0123456789abcdef.glb', 'meta.XYZ.json'])('should reject "%s"', (name) => {
    expect(() => parseTileFileName(name)).toThrow(SyntaxError);
  });

  it('should reject a malformed hash', () => {
    expect(() => tileFilePath('L0_1_1', 'meta', 'abc')).toThrow(SyntaxError);
  });
});
