/**
 * Role: tests feature normalization (ids from both export formats, UTM conversion, Polygon wrapping, tag cleaning, parsed numbers, rejected features).
 * Owner: backend
 */

import { describe, expect, it } from 'vitest';
import { normalizeFeature } from './normalize-feature.ts';

const square = [
  [-4.0672405, 5.3323037],
  [-4.0670709, 5.3322461],
  [-4.0670767, 5.3323168],
  [-4.0672405, 5.3323037],
] as const;

describe('normalizeFeature', () => {
  it('should normalize an overpass building polygon', () => {
    const record = normalizeFeature({
      id: 'way/558265141',
      geometry: { type: 'Polygon', coordinates: [square] },
      properties: { '@id': 'way/558265141', building: 'yes', 'building:levels': 'R+4', name: '  Immeuble  ' },
    });
    expect(record?.id).toBe('osm:way/558265141');
    expect(record?.geometry.type).toBe('MultiPolygon');
    expect(record?.levels).toBe(5);
    expect(record?.tags).toEqual({ building: 'yes', 'building:levels': 'R+4', name: 'Immeuble' });
    const first = record?.geometry.type === 'MultiPolygon' ? record.geometry.coordinates[0]?.[0]?.[0] : undefined;
    expect(first?.[0]).toBe(381_746.6);
    expect(first?.[1]).toBe(589_499.19);
  });

  it('should read osmium attributes and keep points', () => {
    const record = normalizeFeature({
      geometry: { type: 'Point', coordinates: [-4.07, 5.33] },
      properties: { '@type': 'node', '@id': 7, amenity: 'pub' },
    });
    expect(record).toMatchObject({ id: 'osm:node/7', geometry: { type: 'Point' }, tags: { amenity: 'pub' } });
    expect(record).not.toHaveProperty('levels');
  });

  it('should drop features without id or geometry', () => {
    expect(normalizeFeature({ geometry: null, properties: { '@id': 'way/1' } })).toBeNull();
    expect(normalizeFeature({ geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} })).toBeNull();
  });

  it('should round coordinates to the centimetre', () => {
    const record = normalizeFeature({
      geometry: { type: 'Point', coordinates: [-4.0712345678, 5.3312345678] },
      properties: { '@id': 'node/1' },
    });
    const [e, n] = record?.geometry.type === 'Point' ? record.geometry.coordinates : [0, 0];
    expect(Math.round(e * 100) / 100).toBe(e);
    expect(Math.round(n * 100) / 100).toBe(n);
  });
});
