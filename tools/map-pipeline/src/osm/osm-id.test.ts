/**
 * Role: tests stable OSM identifiers from both export formats.
 * Owner: backend
 */

import { describe, expect, it } from 'vitest';
import { stableOsmId } from './osm-id.ts';

describe('stableOsmId', () => {
  it('should read osmium attributes', () => {
    expect(stableOsmId({ '@type': 'way', '@id': 558265139 })).toBe('osm:way/558265139');
  });

  it('should read overpass "type/id" ids from properties or the feature', () => {
    expect(stableOsmId({ '@id': 'node/42' })).toBe('osm:node/42');
    expect(stableOsmId({}, 'relation/3377881')).toBe('osm:relation/3377881');
  });

  it('should return null without identity', () => {
    expect(stableOsmId({ name: 'x' })).toBeNull();
    expect(stableOsmId({ '@type': 'area', '@id': 1 })).toBeNull();
  });
});
