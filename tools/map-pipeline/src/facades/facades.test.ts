/**
 * Role: tests facade generation: profiles, bay and floor layout, seeded grammar (same seed → same facade), entrance and street shops, parapets only on flat roofs, roof choice by shape and size.
 * Owner: backend
 */

import { describe, expect, it } from 'vitest';
import { createSeededRng } from '../determinism/seeded-rng.ts';
import type { UtmRing } from '../records/map-records.ts';
import { buildFacades, type FacadeContext } from './facade-builder.ts';
import { facadeProfileOf } from './facade-profile.ts';
import { chooseRoof, rectangularity } from './roof-choice.ts';
import { floorLayout, wallBays } from './wall-layout.ts';

/** 12 m (east-west) × 9 m house; its south wall (z = 0) faces the street. */
const HOUSE: UtmRing = [[0, 0], [12, 0], [12, 9], [0, 9], [0, 0]];

const context = (over: Partial<FacadeContext> = {}): FacadeContext => ({
  profile: 'courtyard',
  baseYM: 4,
  heightM: 6.5,
  floors: floorLayout(6.5) ?? { groundM: 3.5, upperCount: 1, upperM: 3 },
  roof: { kind: 'flat' },
  streetAt: (_e, _n, _nx, nz) => nz < -0.5,
  rng: createSeededRng('test|house'),
  ...over,
});

describe('facade profile', () => {
  it('should pick the profile from the type, the place category and the levels', () => {
    expect(facadeProfileOf({ type: 'warehouse', levels: 1, placeCategory: null })).toBe('industrial');
    expect(facadeProfileOf({ type: 'yes', levels: 1, placeCategory: 'worship.christian' })).toBe('public');
    expect(facadeProfileOf({ type: 'yes', levels: 1, placeCategory: 'food.maquis' })).toBe('commercial');
    expect(facadeProfileOf({ type: 'yes', levels: 4, placeCategory: null })).toBe('apartments');
    expect(facadeProfileOf({ type: 'house', levels: 1, placeCategory: null })).toBe('courtyard');
  });
});

describe('wall and floor layout', () => {
  it('should split walls into 2.25–4.5 m bays and skip short walls', () => {
    expect(wallBays(2)).toBeNull();
    expect(wallBays(12)).toEqual({ count: 4, widthM: 3 });
    expect(wallBays(4.4)).toEqual({ count: 1, widthM: 4.4 });
    for (let len = 2.5; len < 60; len += 0.1) {
      const w = wallBays(len)?.widthM ?? 0;
      expect(w).toBeGreaterThanOrEqual(2.25);
      expect(w).toBeLessThanOrEqual(4.5);
    }
  });

  it('should fit a 3.5 m ground floor and ~3 m upper floors to the height', () => {
    expect(floorLayout(2)).toBeNull();
    expect(floorLayout(4)).toEqual({ groundM: 4, upperCount: 0, upperM: 0 });
    expect(floorLayout(12.5)).toEqual({ groundM: 3.5, upperCount: 3, upperM: 3 });
  });
});

describe('buildFacades', () => {
  it('should cover every wall with ground and upper bays plus a parapet, seated on the building base', () => {
    const out = buildFacades([HOUSE], context());
    const bays = out.filter((i) => i.module.startsWith('bld_') && !i.module.startsWith('bld_roof'));
    // walls 12, 9, 12, 9 m → 4 + 3 + 4 + 3 = 14 columns × (ground + 1 upper + parapet)
    expect(bays).toHaveLength(42);
    expect(Math.min(...bays.map((i) => i.yM ?? 0))).toBe(4);
    expect(bays.filter((i) => i.module === 'bld_parapet_a').every((i) => i.yM === 10.5)).toBe(true);
  });

  it('should face each bay outwards and put the entrance gate on the street wall', () => {
    const out = buildFacades([HOUSE], context());
    const gate = out.find((i) => i.module === 'bld_gate_metal_a');
    expect(gate?.n).toBe(0); // south wall
    expect(gate?.yawRad).toBeCloseTo(Math.PI, 5); // facing south
    const east = out.find((i) => i.e === 12 && i.module !== 'bld_roof_rebar_a');
    expect(east?.yawRad).toBeCloseTo(Math.PI / 2, 5);
  });

  it('should be deterministic for a seed and change with another seed', () => {
    const modules = (seed: string): string => buildFacades([HOUSE], context({ rng: createSeededRng(seed) })).map((i) => `${i.module}:${i.variant}`).join();
    expect(modules('a')).toBe(modules('a'));
    expect(modules('a')).not.toBe(modules('b'));
  });

  it('should open shops on the street side of commercial buildings and skip parapets under sheet roofs', () => {
    const corners = [[0, 0], [12, 0], [12, 9], [0, 9]] as const;
    const out = buildFacades([HOUSE], context({ profile: 'commercial', roof: { kind: 'sheet-gable', corners, riseM: 1.2 } }));
    const southGround = out.filter((i) => i.n === 0 && i.yM === 4).map((i) => i.module);
    expect(southGround.every((m) => m.startsWith('bld_shopfront') || m === 'bld_gf_window_a')).toBe(true);
    expect(out.some((i) => i.module === 'bld_parapet_a' || i.module.startsWith('bld_roof'))).toBe(false);
  });
});

describe('chooseRoof', () => {
  it('should only put sheet roofs on simple, rectangular, small buildings inside one tile', () => {
    const rect = HOUSE;
    const l: UtmRing = [[0, 0], [20, 0], [20, 4], [4, 4], [4, 20], [0, 20], [0, 0]];
    expect(rectangularity(rect)).toBeCloseTo(1, 5);
    expect(rectangularity(l)).toBeLessThan(0.5);
    const industrial = (ring: UtmRing | null, insideOneTile = true) => chooseRoof({ profile: 'industrial', levels: 1, simpleRing: ring, insideOneTile }, createSeededRng('x'));
    expect(industrial(l).kind).toBe('flat');
    expect(industrial(rect, false).kind).toBe('flat');
    expect(industrial(null).kind).toBe('flat');
    expect(chooseRoof({ profile: 'apartments', levels: 4, simpleRing: rect, insideOneTile: true }, createSeededRng('x')).kind).toBe('flat');
    const kinds = new Set(Array.from({ length: 40 }, (_, k) => chooseRoof({ profile: 'industrial', levels: 1, simpleRing: rect, insideOneTile: true }, createSeededRng(`s${k}`)).kind));
    expect(kinds.has('sheet-gable') || kinds.has('sheet-mono')).toBe(true);
  });
});
