/**
 * Role: tests place typing and site placement: one type per category, inside sites in the building, front sites just outside the facade towards the road, around sites near a street place, reproducible per seed.
 * Owner: backend
 */

import { PlaceTypeSchema } from '@skyline/content-schema';
import { describe, expect, it } from 'vitest';
import { createSeededRng } from '../determinism/seeded-rng.ts';
import { PlacementGuards } from '../props/placement-guards.ts';
import type { UtmRing } from '../records/map-records.ts';
import { PlaceTypeCatalogue } from './place-type-catalogue.ts';
import { type PlacedSite, placeSites } from './site-placement.ts';

const type = (id: string, categories: string[], sites: { kind: string; capacity: number; placement: 'inside' | 'front' | 'around' }[]) =>
  PlaceTypeSchema.parse({ id, version: 1, labelKey: `place.${id}.label`, osmCategories: categories, sites });

const maquis = type('maquis', ['food.maquis', 'food.bar'], [{ kind: 'seat', capacity: 8, placement: 'front' }, { kind: 'dance', capacity: 6, placement: 'front' }, { kind: 'kitchen', capacity: 1, placement: 'inside' }]);
const stand = type('garba_stand', ['food.street_food'], [{ kind: 'counter', capacity: 4, placement: 'around' }]);

/** A 10 × 10 m building at (0..10, 0..10) and an east–west road along n = 20 (north of it). */
const building: UtmRing = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]];
const guards = new PlacementGuards([{ footprint: { type: 'MultiPolygon', coordinates: [[building]] } }], [{ geometry: [[-50, 20], [50, 20]], widthM: 6 }]);

describe('PlaceTypeCatalogue', () => {
  it('should map each category to one type and refuse a category claimed twice', () => {
    const catalogue = new PlaceTypeCatalogue([maquis, stand]);
    expect(catalogue.typeOf('food.bar')?.id).toBe('maquis');
    expect(catalogue.typeOf('health.pharmacy')).toBeNull();
    expect(() => new PlaceTypeCatalogue([maquis, type('bar', ['food.bar'], [{ kind: 'seat', capacity: 1, placement: 'inside' }])])).toThrow(/claimed by place types/);
  });
});

describe('placeSites', () => {
  it('should put front sites just outside the facade on the road side and inside sites in the building', () => {
    const [seat, dance, kitchen] = placeSites({ point: [5, 5], type: maquis, footprint: building }, guards, createSeededRng('a')) as [PlacedSite, PlacedSite, PlacedSite];
    expect(seat.n).toBeGreaterThan(10);
    expect(seat.n).toBeLessThan(12.5);
    expect(dance.n).toBe(seat.n);
    expect(Math.abs(dance.e - seat.e)).toBeCloseTo(2.5, 5);
    expect(Math.abs(seat.yawRad)).toBeCloseTo(Math.PI, 2); // facing the building (south), ±π
    expect(guards.insideBuilding(kitchen.e, kitchen.n)).toBe(true);
  });

  it('should use the footprint centre when the place point falls outside its own building', () => {
    const [kitchen] = placeSites({ point: [12, 5], type: type('x', ['a.b'], [{ kind: 'k', capacity: 1, placement: 'inside' }]), footprint: building }, guards, createSeededRng('a'));
    expect(kitchen).toMatchObject({ e: 5, n: 5 });
  });

  it('should scatter around sites near a street place, the same way for the same seed', () => {
    const a = placeSites({ point: [30, 25], type: stand, footprint: null }, guards, createSeededRng('s'));
    expect(a).toEqual(placeSites({ point: [30, 25], type: stand, footprint: null }, guards, createSeededRng('s')));
    expect(Math.hypot((a[0]?.e ?? 0) - 30, (a[0]?.n ?? 0) - 25)).toBeLessThanOrEqual(3.01);
  });
});
