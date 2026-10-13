/**
 * Role: tests the GeoJSON geometry helpers (bbox, point-in-polygon with holes, area and length in metres).
 * Owner: backend
 */

import { describe, expect, it } from 'vitest';
import { areaM2, bboxOf, containsPoint, type Geometry, lengthM, representativePoint } from './geojson-geometry.ts';

/** ~1 km × 1 km square near Yopougon (0.009° ≈ 1 km). */
const SQUARE: Geometry = {
  type: 'Polygon',
  coordinates: [
    [
      [-4.08, 5.33],
      [-4.071, 5.33],
      [-4.071, 5.339],
      [-4.08, 5.339],
      [-4.08, 5.33],
    ],
  ],
};

const WITH_HOLE: Geometry = {
  type: 'Polygon',
  coordinates: [
    ...SQUARE.coordinates,
    [
      [-4.077, 5.333],
      [-4.074, 5.333],
      [-4.074, 5.336],
      [-4.077, 5.336],
      [-4.077, 5.333],
    ],
  ],
};

describe('geojson geometry', () => {
  it('should compute the bbox', () => {
    expect(bboxOf(SQUARE)).toEqual([-4.08, 5.33, -4.071, 5.339]);
  });

  it('should find points inside and outside, holes excluded', () => {
    expect(containsPoint(SQUARE, [-4.075, 5.335])).toBe(true);
    expect(containsPoint(SQUARE, [-4.06, 5.335])).toBe(false);
    expect(containsPoint(WITH_HOLE, [-4.0755, 5.3345])).toBe(false);
    expect(containsPoint(WITH_HOLE, [-4.079, 5.331])).toBe(true);
  });

  it('should measure about 1 km² for the square and subtract holes', () => {
    expect(areaM2(SQUARE) / 1e6).toBeGreaterThan(0.98);
    expect(areaM2(SQUARE) / 1e6).toBeLessThan(1.0);
    expect(areaM2(WITH_HOLE)).toBeLessThan(areaM2(SQUARE));
  });

  it('should measure a line length in metres', () => {
    const line: Geometry = { type: 'LineString', coordinates: [[-4.08, 5.33], [-4.08, 5.339]] };
    expect(lengthM(line)).toBeGreaterThan(990);
    expect(lengthM(line)).toBeLessThan(1000);
  });

  it('should place the representative point at the vertex average', () => {
    const [lon, lat] = representativePoint({ type: 'LineString', coordinates: [[0, 0], [2, 2]] });
    expect([lon, lat]).toEqual([1, 1]);
  });
});
