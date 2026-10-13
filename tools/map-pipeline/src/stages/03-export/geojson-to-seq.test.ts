/**
 * Role: tests the FeatureCollection → GeoJSONSeq conversion used for the golden fixture.
 * Owner: backend
 */

import { describe, expect, it } from 'vitest';
import { featureCollectionToSeq } from './geojson-to-seq.ts';

describe('featureCollectionToSeq', () => {
  it('should write one feature per line', () => {
    const seq = featureCollectionToSeq(JSON.stringify({ type: 'FeatureCollection', features: [{ id: 1 }, { id: 2 }] }));
    expect(seq).toBe('{"id":1}\n{"id":2}\n');
  });

  it('should reject anything that is not a FeatureCollection', () => {
    expect(() => featureCollectionToSeq('{"type":"Feature"}')).toThrow(/FeatureCollection/);
  });
});
