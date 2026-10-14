/**
 * Role: tests neighbourhood heights: polygon before nearest point, distance limit, profile file validation and name keys, profiles applied to generic buildings only.
 * Owner: backend
 */

import { describe, expect, it } from 'vitest';
import { neighbourhoodKey, NeighbourhoodProfilesSchema, profileNameOf } from '../config/neighbourhood-profiles.ts';
import { createSeededRng } from '../determinism/seeded-rng.ts';
import { resolveHeight } from './height-heuristics.ts';
import { NeighbourhoodIndex } from './neighbourhood-index.ts';

const square = (x: number, z: number, s: number) => [[[[x, z], [x + s, z], [x + s, z + s], [x, z + s], [x, z]]]] as [number, number][][][];

const index = (): NeighbourhoodIndex => {
  const idx = new NeighbourhoodIndex();
  idx.add({ tags: { place: 'neighbourhood', name: 'Sicogi' }, geometry: { type: 'MultiPolygon', coordinates: square(0, 0, 500) } });
  idx.add({ tags: { place: 'neighbourhood', name: 'Wassakara' }, geometry: { type: 'Point', coordinates: [100, 100] } });
  idx.add({ tags: { place: 'neighbourhood', name: 'Gesco' }, geometry: { type: 'Point', coordinates: [2000, 0] } });
  idx.add({ tags: { amenity: 'school', name: 'École' }, geometry: { type: 'Point', coordinates: [10, 10] } });
  idx.add({ tags: { place: 'suburb', name: 'Yopougon' }, geometry: { type: 'MultiPolygon', coordinates: square(-5000, -5000, 10000) } });
  idx.add({ tags: { place: 'suburb', name: 'Attécoubé' }, geometry: { type: 'Point', coordinates: [4000, 4000] } });
  return idx.finish();
};

describe('NeighbourhoodIndex', () => {
  it('should prefer the containing polygon, then the nearest point within the distance', () => {
    const idx = index();
    expect(idx.size).toBe(4);
    expect(idx.nameAt(120, 120, 1200)).toBe('Sicogi');
    expect(idx.nameAt(1500, 0, 1200)).toBe('Gesco');
    // the commune-wide suburb polygon is ignored; a suburb point is only a fallback
    expect(idx.nameAt(3500, 3500, 1200)).toBe('Attécoubé');
    expect(idx.nameAt(8000, 8000, 1200)).toBeNull();
  });
});

describe('neighbourhood profiles file', () => {
  it('should refuse a neighbourhood mapped to an unknown profile and a profile with both shapes', () => {
    const base = { reviewedBy: null, maxPointDistanceM: 1000, minFootprintM2: 40, profiles: { courtyard: { levels: [[1, 1]] } } };
    expect(NeighbourhoodProfilesSchema.safeParse({ ...base, neighbourhoods: { Wassakara: 'courtyard' } }).success).toBe(true);
    expect(NeighbourhoodProfilesSchema.safeParse({ ...base, neighbourhoods: { Wassakara: 'nope' } }).success).toBe(false);
    expect(NeighbourhoodProfilesSchema.safeParse({ ...base, profiles: { bad: { levels: [[1, 1]], heightM: [3, 4] } }, neighbourhoods: {} }).success).toBe(false);
  });

  it('should match names whatever the accents, case and punctuation', () => {
    expect(neighbourhoodKey('Port-Bouët II')).toBe(neighbourhoodKey('port bouet  ii'));
    expect(neighbourhoodKey('Sogefiha Solic 1 & 2')).toBe('sogefiha solic 1 2');
  });

  it('should resolve a profile by exact name first, then by pattern', () => {
    const config = { neighbourhoods: { 'Cité Verte': 'courtyard' }, patterns: [['^cite ', 'planned-houses'], ['village', 'village']] as [string, string][] };
    expect(profileNameOf(config, 'Cité  verte')).toBe('courtyard');
    expect(profileNameOf(config, 'Cité Élisée')).toBe('planned-houses');
    expect(profileNameOf(config, 'Quartier Agban Village')).toBe('village');
    expect(profileNameOf(config, 'Le Plateau')).toBeNull();
  });
});

describe('resolveHeight with a neighbourhood profile', () => {
  it('should apply the profile to generic buildings only, and OSM tags still win', () => {
    const tower = { levels: [[5, 1]] as [number, number][] };
    expect(resolveHeight({ type: 'yes', footprintAreaM2: 200, profile: tower }, createSeededRng('a')).levels).toBe(5);
    expect(resolveHeight({ type: 'church', footprintAreaM2: 200, profile: tower }, createSeededRng('a')).levels).toBe(1);
    expect(resolveHeight({ type: 'yes', footprintAreaM2: 200, osmLevels: 2, profile: tower }, createSeededRng('a')).levels).toBe(2);
    const shed = resolveHeight({ type: 'yes', footprintAreaM2: 800, profile: { heightM: [6, 11] } }, createSeededRng('b'));
    expect(shed.heightM).toBeGreaterThanOrEqual(6);
    expect(shed.heightM).toBeLessThanOrEqual(11);
  });
});
