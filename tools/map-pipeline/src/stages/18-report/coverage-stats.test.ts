/**
 * Role: tests the coverage accumulator (boundary clipping, building heights, road length, POIs, per-tile density) and the land-cover classifier of empty tiles.
 * Owner: backend
 */

import { describe, expect, it } from 'vitest';
import type { Geometry } from '../../geometry/geojson-geometry.ts';
import { addFeature, emptyStats, topEntries } from './coverage-stats.ts';
import type { OsmFeature } from './feature-stream.ts';
import { GapCover } from './gap-cover.ts';

const square = (w: number, s: number, size: number): Geometry => ({
  type: 'Polygon',
  coordinates: [
    [
      [w, s],
      [w + size, s],
      [w + size, s + size],
      [w, s + size],
      [w, s],
    ],
  ],
});

const BOUNDARY = square(-4.08, 5.33, 0.01);
const feature = (geometry: Geometry, properties: OsmFeature['properties']): OsmFeature => ({ geometry, properties });

describe('addFeature', () => {
  it('should count buildings inside the boundary with their height tags and tile', () => {
    const stats = emptyStats();
    addFeature(stats, feature(square(-4.075, 5.335, 0.0001), { building: 'yes', 'building:levels': '2' }), BOUNDARY);
    addFeature(stats, feature(square(-4.05, 5.335, 0.0001), { building: 'yes' }), BOUNDARY); // outside
    expect(stats.featuresRead).toBe(2);
    expect(stats.buildings).toBe(1);
    expect(stats.buildingsWithLevels).toBe(1);
    expect(Object.values(stats.buildingsPerTile)).toEqual([1]);
  });

  it('should sum road length by class and count named POIs', () => {
    const stats = emptyStats();
    addFeature(stats, feature({ type: 'LineString', coordinates: [[-4.075, 5.331], [-4.075, 5.339]] }, { highway: 'residential' }), BOUNDARY);
    addFeature(stats, feature({ type: 'Point', coordinates: [-4.075, 5.335] }, { amenity: 'pub', name: 'Maquis' }), BOUNDARY);
    addFeature(stats, feature({ type: 'Point', coordinates: [-4.074, 5.335] }, { shop: 'kiosk' }), BOUNDARY);
    expect(stats.roadKmByClass['residential']).toBeCloseTo(0.885, 2);
    expect(stats.pois).toBe(2);
    expect(stats.poisNamed).toBe(1);
    expect(topEntries(stats.poiCategories, 1)).toEqual([['amenity=pub', 1]]);
  });
});

describe('GapCover', () => {
  it('should classify a point by the highest-priority cover containing it', () => {
    const cover = new GapCover();
    cover.collect(feature(square(-4.08, 5.33, 0.01), { landuse: 'farmland' }));
    cover.collect(feature(square(-4.076, 5.334, 0.002), { natural: 'water' }));
    expect(cover.classify([-4.075, 5.335])).toBe('water');
    expect(cover.classify([-4.079, 5.331])).toBe('farmland');
    expect(cover.classify([-4.0, 5.0])).toBe('unmapped');
  });
});
