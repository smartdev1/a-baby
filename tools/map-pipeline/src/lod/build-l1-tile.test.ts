/**
 * Role: tests L1 building: ring simplification, children merged with their offsets, small buildings and paths dropped, terrain and water downsampled.
 * Owner: backend
 */

import { childTileKeys } from '@skyline/geo';
import { describe, expect, it } from 'vitest';
import { emptyTileContent, type TileContent } from '../tiling/tile-content.ts';
import { buildL1Tile } from './build-l1-tile.ts';
import { ringAreaM2, simplifyRing } from './simplify-ring.ts';

const L1 = 'L1_162_99';
const square = (x: number, z: number, size: number) => [[x, z], [x + size, z], [x + size, z + size], [x, z + size], [x, z]] as [number, number][];
const allWater = Buffer.from(new Uint8Array(Math.ceil(2500 / 8)).fill(255)).toString('base64');

const child = (key: string, water: boolean): TileContent => {
  const t = emptyTileContent(key);
  t.buildingParts.push({ id: 'osm:way/1', baseYM: 0, heightM: 6, polygons: [[square(10, 10, 20)]] }); // 400 m²: kept
  t.buildingParts.push({ id: 'osm:way/2', baseYM: 0, heightM: 3, polygons: [[square(100, 100, 4)]] }); // 16 m²: dropped
  t.roads.push({ id: 'osm:way/3', roadClass: 'residential', lines: [[[0, 50], [250, 50]]] }, { id: 'osm:way/4', roadClass: 'footway', lines: [[[0, 60], [250, 60]]] });
  t.terrain = { key, resolution: 51, cellSizeM: 5, heightsM: Array.from({ length: 51 * 51 }, (_, k) => Math.floor(k / 51)), water: water ? { levelM: 0, cellsPerSide: 50, maskBase64: allWater } : null };
  return t;
};

describe('simplifyRing', () => {
  it('should drop vertices closer than the tolerance and keep the area', () => {
    const noisy = [[0, 0], [5, 0.2], [10, 0], [10, 10], [5, 10.3], [0, 10], [0, 0]] as [number, number][];
    const simple = simplifyRing(noisy, 1.5);
    expect(simple?.length).toBe(5);
    expect(ringAreaM2(simple ?? [])).toBeCloseTo(100, 0);
  });
});

describe('buildL1Tile', () => {
  it('should merge the 4 children with their offsets, filter details and downsample terrain and water', () => {
    const keys = childTileKeys(L1);
    const children = new Map(keys.map((k, n) => [k, child(k, n === 0)]));
    const t = buildL1Tile(L1, children);
    expect(t.buildingParts).toHaveLength(4); // one kept building per child
    expect(t.buildingParts.map((p) => p.polygons[0]?.[0]?.[0])).toEqual([[10, 10], [260, 10], [10, 260], [260, 260]]);
    expect(t.roads.every((r) => r.roadClass === 'residential')).toBe(true);
    expect(t.terrain?.cellSizeM).toBe(10);
    expect(t.terrain?.heightsM[2 * 51]).toBe(4); // L1 row 2 = 20 m = child row 4
    const mask = Buffer.from(t.terrain?.water?.maskBase64 ?? '', 'base64');
    expect(mask[0]).toBe(255); // south-west quarter (child 0) is water
    expect((mask[mask.length - 1] ?? 0) & 1).toBe(0);
  });
});
