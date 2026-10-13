/**
 * Role: tests props and vegetation placement: lights along streets at the right spacing and outside buildings, kiosks facing the road, seeded trees only inside their polygon.
 * Owner: backend
 */

import { describe, expect, it } from 'vitest';
import type { BuildingRecord, ClassifiedRecord } from '../records/map-records.ts';
import type { RoadEdge } from '../roads/road-graph-types.ts';
import { PlacementGuards } from './placement-guards.ts';
import { pointFurniture, streetLights } from './street-furniture.ts';
import { vegetation } from './vegetation.ts';

const street = (roadClass: string, length = 200): RoadEdge => ({
  id: 'e0', wayId: 'osm:way/1', from: 'n0', to: 'n1', roadClass, lengthM: length, widthM: 6, oneway: 0, cars: true, pedestrians: true, sidewalks: 'both', layer: 0,
  geometry: [[0, 0], [length, 0]],
});
const building = (e: number, n: number, size: number): Pick<BuildingRecord, 'footprint'> => ({
  footprint: { type: 'MultiPolygon', coordinates: [[[[e, n], [e + size, n], [e + size, n + size], [e, n + size], [e, n]]]] },
});
const record = (geometry: ClassifiedRecord['geometry'], tags: Record<string, string>, id = 'osm:node/1'): ClassifiedRecord => ({
  id: id as ClassifiedRecord['id'], geometry, tags, isBuilding: false, placeCategory: null, roadClass: null,
});

describe('streetLights', () => {
  it('should light a residential street every 40 m on one side, outside buildings', () => {
    const guards = new PlacementGuards([building(55, -12, 10)], [street('residential')]); // south side, where the lights stand
    const lights = streetLights([street('residential')], guards);
    expect(lights.map((l) => Math.round(l.e))).toEqual([20, 100, 140, 180]); // the one at 60 m is inside the building
    expect(lights.every((l) => Math.abs(l.n) > 3)).toBe(true); // beside the 6 m carriageway
  });

  it('should alternate sides on a primary road and skip unlit classes', () => {
    const guards = new PlacementGuards([], [street('primary')]);
    const lights = streetLights([street('primary')], guards);
    expect(new Set(lights.map((l) => Math.sign(l.n))).size).toBe(2);
    expect(streetLights([street('footway')], guards)).toEqual([]);
  });
});

describe('pointFurniture', () => {
  it('should place a kiosk with a bin and face the nearest road', () => {
    const guards = new PlacementGuards([], [street('residential')]);
    const out = pointFurniture([record({ type: 'Point', coordinates: [50, 20] }, { shop: 'kiosk' })], guards);
    expect(out.map((o) => o.module)).toEqual(['prp_kiosk_a', 'prp_trash_bin_a']);
    expect(Math.abs(Math.abs(out[0]?.yawRad ?? 0) - Math.PI)).toBeLessThan(1e-6); // facing south, towards the road
  });
});

describe('vegetation', () => {
  it('should fill a wood with seeded trees inside the polygon only', () => {
    const wood = record({ type: 'MultiPolygon', coordinates: [[[[0, 50], [70, 50], [70, 120], [0, 120], [0, 50]]]] }, { natural: 'wood' }, 'osm:way/9');
    const guards = new PlacementGuards([], [street('residential')]);
    const a = vegetation([wood], { seed: 's', guards });
    expect(a.length).toBeGreaterThan(50);
    expect(a.every((t) => t.e >= 0 && t.e <= 70 && t.n >= 50 && t.n <= 120)).toBe(true);
    expect(vegetation([wood], { seed: 's', guards })).toEqual(a);
  });
});
