/**
 * Role: tests the height priority (height > levels > heuristic), determinism per OSM id and plausibility of heuristic draws.
 * Owner: backend
 */

import { describe, expect, it } from 'vitest';
import { rngFor } from '../determinism/seeded-rng.ts';
import { heightFromLevels, resolveHeight } from './height-heuristics.ts';

const rng = (id = 'osm:way/1') => rngFor('test-seed', id);

describe('resolveHeight', () => {
  it('should prefer the OSM height tag, then the levels tag', () => {
    expect(resolveHeight({ type: 'yes', footprintAreaM2: 100, osmHeightM: 12.5 }, rng())).toEqual({
      levels: 4,
      heightM: 12.5,
      heightSource: 'osm',
    });
    expect(resolveHeight({ type: 'yes', footprintAreaM2: 100, osmLevels: 3 }, rng())).toEqual({
      levels: 3,
      heightM: 9.5,
      heightSource: 'osm',
    });
  });

  it('should give the same result for the same building id', () => {
    const input = { type: 'yes', footprintAreaM2: 300 };
    expect(resolveHeight(input, rng('osm:way/42'))).toEqual(resolveHeight(input, rng('osm:way/42')));
  });

  it('should keep heuristic draws inside the type distribution', () => {
    for (let k = 0; k < 500; k++) {
      const apartments = resolveHeight({ type: 'apartments', footprintAreaM2: 300 }, rng(`osm:way/${k}`));
      expect(apartments.levels).toBeGreaterThanOrEqual(3);
      expect(apartments.levels).toBeLessThanOrEqual(6);
      expect(apartments.heightSource).toBe('heuristic');
      const tiny = resolveHeight({ type: 'yes', footprintAreaM2: 20 }, rng(`osm:way/${k}`));
      expect(tiny.levels).toBe(1);
    }
  });

  it('should use a height range for single-volume types', () => {
    const church = resolveHeight({ type: 'church', footprintAreaM2: 500 }, rng());
    expect(church.levels).toBe(1);
    expect(church.heightM).toBeGreaterThanOrEqual(9);
    expect(church.heightM).toBeLessThanOrEqual(14);
  });

  it('should compute storey heights with a taller ground floor', () => {
    expect(heightFromLevels(1)).toBe(3.5);
    expect(heightFromLevels(5)).toBe(15.5);
  });
});
