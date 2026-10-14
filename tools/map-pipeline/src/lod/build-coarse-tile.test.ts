/**
 * Role: tests L2/L3 building: descendants placed with their offsets, buildings turned into block impostors (dense cells only, sunk into the ground), major roads kept, terrain and water on the coarse grid.
 * Owner: backend
 */

import { childTileKeys, tileBounds } from '@skyline/geo';
import { describe, expect, it } from 'vitest';
import { emptyTileContent, type LocalPoint, type TileContent } from '../tiling/tile-content.ts';
import { blockImpostors } from './block-impostors.ts';
import { buildCoarseTile } from './build-coarse-tile.ts';

const square = (x: number, z: number, size: number): LocalPoint[] => [[x, z], [x + size, z], [x + size, z + size], [x, z + size], [x, z]];
const allWater = Buffer.from(new Uint8Array(Math.ceil(2500 / 8)).fill(255)).toString('base64');

/** The 16 L0 descendants of an L2 tile; the south-west one is lagoon, the others are 10 m high ground. */
const descendants = (l2: string): Map<string, TileContent> => {
  const l0 = childTileKeys(l2).flatMap((l1) => childTileKeys(l1));
  const sw = tileBounds(l2);
  return new Map(
    l0.map((key) => {
      const t = emptyTileContent(key);
      const isLagoon = tileBounds(key).minEastingM === sw.minEastingM && tileBounds(key).minNorthingM === sw.minNorthingM;
      t.terrain = { key, resolution: 51, cellSizeM: 5, heightsM: new Array<number>(51 * 51).fill(isLagoon ? -1 : 10), water: isLagoon ? { levelM: 0, cellsPerSide: 50, maskBase64: allWater } : null };
      if (!isLagoon) {
        t.buildingParts.push({ id: 'osm:way/1', baseYM: 10, heightM: 9, polygons: [[square(40, 40, 18)]] });
        t.roads.push({ id: 'osm:way/2', roadClass: 'primary', lines: [[[0, 100], [250, 100]]] }, { id: 'osm:way/3', roadClass: 'residential', lines: [[[0, 150], [250, 150]]] });
      }
      return [key, t];
    }),
  );
};

describe('blockImpostors', () => {
  it('should turn a dense cell into one box with the mean height and leave sparse cells empty', () => {
    const parts = [
      { rings: [square(0, 0, 20)], topYM: 9 },
      { rings: [square(40, 40, 3)], topYM: 6 },
    ];
    const blocks = blockImpostors(parts, { sizeM: 100, cellM: 20 }, () => 0);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({ id: 'block:0', baseYM: -1, heightM: 10 });
  });
});

describe('buildCoarseTile', () => {
  it('should build an L2 tile with block impostors, major roads only and a coarse terrain with water', () => {
    const key = 'L2_81_49';
    const tile = buildCoarseTile(key, 2, descendants(key));
    expect(tile.key).toBe(key);
    expect(tile.terrain?.resolution).toBe(51);
    expect(tile.terrain?.cellSizeM).toBe(20);
    expect(tile.terrain?.water).not.toBeNull();
    expect(tile.roads.every((r) => r.roadClass === 'primary')).toBe(true);
    expect(tile.roads).toHaveLength(15);
    // one 18 m building in each of the 15 dry L0 tiles: 1 to 4 built 20 m cells each, depending on the grid alignment
    expect(tile.buildingParts.length).toBeGreaterThanOrEqual(15);
    expect(tile.buildingParts.length).toBeLessThanOrEqual(60);
    for (const b of tile.buildingParts) {
      expect(b.baseYM).toBe(9);
      expect(b.baseYM + b.heightM).toBeCloseTo(19, 5);
    }
    const xs = tile.buildingParts.flatMap((b) => b.polygons.flatMap((p) => (p[0] ?? []).map((pt) => pt[0])));
    expect(Math.max(...xs)).toBeGreaterThan(750);
  });
});
