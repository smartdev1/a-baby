/**
 * Role: tests tile encoding end to end on a small tile: valid meta and collision, deterministic hashes, budget violations named by tile key.
 * Owner: backend
 */

import { decodeCollision, parseTileMeta } from '@skyline/tile-format';
import { describe, expect, it } from 'vitest';
import type { TileContent } from '../tiling/tile-content.ts';
import { budgetViolations } from './tile-budgets.ts';
import { encodeTile } from './tile-encoder.ts';

const TILE: TileContent = {
  key: 'L0_325_199',
  buildingParts: [{ id: 'osm:way/1', baseYM: 0, heightM: 9.5, polygons: [[[[10, 10], [40, 10], [40, 20], [20, 20], [20, 40], [10, 40], [10, 10]]]] }],
  buildingMeta: [{ id: 'osm:way/1', type: 'apartments', levels: 3, heightM: 9.5, heightSource: 'heuristic' }],
  roads: [{ id: 'osm:way/2', roadClass: 'residential', lines: [[[0, 100], [250, 100]]] }],
  places: [{ id: 'osm:node/3', category: 'food.maquis', position: [30, 60], buildingId: null, displayName: 'Maquis Le Bigeon' }],
  instances: [{ module: 6, position: [100, 100], yawRad: 0, scale: 1, variant: 0 }],
  terrain: null,
};

describe('encodeTile', () => {
  it('should produce valid meta and collision files', async () => {
    const encoded = await encodeTile(TILE, new Set(['L0_325_199', 'L0_326_199']));
    const meta = parseTileMeta(JSON.parse(new TextDecoder().decode(encoded.meta.bytes)));
    expect(meta.neighbours).toEqual(['L0_326_199']);
    expect(meta.places[0]).toMatchObject({ category: 'food.maquis', displayName: 'Maquis Le Bigeon', position: { x: 30, z: 60 } });
    const collision = decodeCollision(encoded.collision.bytes);
    expect(collision.prisms).toHaveLength(1);
    expect(collision.prisms[0]?.topYM).toBe(9.5);
    expect(encoded.drawCalls).toBe(5); // ground, road, walls, roofs + 1 instanced module
    expect(encoded.instanceCount).toBe(1);
  });

  it('should give the same hashes on two encodings', async () => {
    const [a, b] = await Promise.all([encodeTile(TILE, new Set()), encodeTile(TILE, new Set())]);
    expect([a.geom.hash, a.collision.hash, a.meta.hash]).toEqual([b.geom.hash, b.collision.hash, b.meta.hash]);
  });

  it('should name the tile when it is over budget', async () => {
    const encoded = await encodeTile(TILE, new Set());
    expect(budgetViolations({ ...encoded, triangles: 500_000 })).toEqual([
      'tile L0_325_199 over budget: 500000 triangles > 400000',
    ]);
  });
});
