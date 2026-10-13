/**
 * Role: tests place classification (maquis, worship by religion, areal POIs, defaults) and building / road detection.
 * Owner: backend
 */

import { describe, expect, it } from 'vitest';
import type { NormalizedRecord } from '../records/map-records.ts';
import { classifyRecord, placeCategoryOf } from './classify-record.ts';

const AREA: NormalizedRecord['geometry'] = { type: 'MultiPolygon', coordinates: [[[[0, 0], [10, 0], [10, 10], [0, 0]]]] };
const LINE: NormalizedRecord['geometry'] = { type: 'LineString', coordinates: [[0, 0], [10, 0]] };
const POINT: NormalizedRecord['geometry'] = { type: 'Point', coordinates: [0, 0] };
const rec = (geometry: NormalizedRecord['geometry'], tags: Record<string, string>): NormalizedRecord => ({ id: 'osm:way/1', geometry, tags });

describe('placeCategoryOf', () => {
  it.each([
    [{ amenity: 'pub' }, 'food.maquis'],
    [{ amenity: 'money_transfer' }, 'finance.mobile_money'],
    [{ amenity: 'place_of_worship', religion: 'muslim' }, 'worship.mosque'],
    [{ amenity: 'place_of_worship', religion: 'christian' }, 'worship.church'],
    [{ amenity: 'place_of_worship' }, 'worship.other'],
    [{ shop: 'hairdresser' }, 'beauty.hairdresser'],
    [{ shop: 'something_new' }, 'commerce.shop'],
    [{ public_transport: 'platform' }, 'transport.stop'],
    [{ building: 'church' }, 'worship.church'],
  ])('should classify %o as %s', (tags, expected) => {
    expect(placeCategoryOf(tags)).toBe(expected);
  });

  it.each([[{ building: 'yes' }], [{ highway: 'residential' }], [{ natural: 'tree' }]])('should not make %o a place', (tags) => {
    expect(placeCategoryOf(tags)).toBeNull();
  });
});

describe('classifyRecord', () => {
  it('should keep an areal school as both a building and a place', () => {
    expect(classifyRecord(rec(AREA, { building: 'school', amenity: 'school' }))).toMatchObject({ isBuilding: true, placeCategory: 'education.school' });
  });

  it('should detect roads only on lines', () => {
    expect(classifyRecord(rec(LINE, { highway: 'residential' })).roadClass).toBe('residential');
    expect(classifyRecord(rec(POINT, { highway: 'bus_stop' }))).toMatchObject({ roadClass: null, placeCategory: 'transport.stop' });
  });

  it('should not count building=no or point buildings', () => {
    expect(classifyRecord(rec(AREA, { building: 'no' })).isBuilding).toBe(false);
    expect(classifyRecord(rec(POINT, { building: 'yes' })).isBuilding).toBe(false);
  });
});
