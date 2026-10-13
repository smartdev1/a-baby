/**
 * Role: unit tests of the legacy blockout polyline helpers.
 * Owner: frontend
 */

import { describe, expect, it } from 'vitest';
import { dedupePoints, openRing, stringHash } from './polyline.ts';

describe('polyline helpers', () => {
  it('should drop consecutive duplicates when points repeat', () => {
    expect(dedupePoints([{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 }])).toEqual([{ x: 0, y: 0 }, { x: 1, y: 0 }]);
  });

  it('should remove the closing point when the ring is closed', () => {
    const ring = openRing([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 0 }]);
    expect(ring).toHaveLength(3);
  });

  it('should return the same hash when called twice with the same id', () => {
    expect(stringHash('bldg_way_1')).toBe(stringHash('bldg_way_1'));
  });
});
