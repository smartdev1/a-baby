/**
 * Role: roof of a building: flat concrete (with parapet) or corrugated sheet metal (mono- or dual-pitch over the footprint's oriented rectangle), chosen by profile, shape, size and seed.
 * Owner: backend
 */

import type { SeededRng } from '../determinism/seeded-rng.ts';
import type { UtmPoint, UtmRing } from '../records/map-records.ts';
import type { FacadeProfile } from './facade-profile.ts';

/** Wall-top corners counter-clockwise (the mesh adds the overhang); corners[0] → corners[1] is a long side (low eave of a mono-pitch roof). */
export interface PitchedRoof {
  readonly kind: 'sheet-gable' | 'sheet-mono';
  readonly corners: readonly [UtmPoint, UtmPoint, UtmPoint, UtmPoint];
  /** Height of the ridge (gable) or of the high eave (mono) above the walls. */
  readonly riseM: number;
}

export type Roof = { readonly kind: 'flat' } | PitchedRoof;

const SHEET_ODDS: Readonly<Record<FacadeProfile, number>> = { industrial: 0.9, courtyard: 0.55, commercial: 0.35, public: 0.3, apartments: 0 };
const MIN_RECTANGULARITY = 0.85;
const GABLE_SLOPE = Math.tan((15 * Math.PI) / 180);
const MONO_SLOPE = Math.tan((8 * Math.PI) / 180);

const ringArea = (ring: UtmRing): number => {
  let twice = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) twice += (ring[j]?.[0] ?? 0) * (ring[i]?.[1] ?? 0) - (ring[i]?.[0] ?? 0) * (ring[j]?.[1] ?? 0);
  return Math.abs(twice / 2);
};

interface OrientedRect {
  readonly centre: UtmPoint;
  /** Unit vector of the long side. */
  readonly axis: UtmPoint;
  readonly halfLong: number;
  readonly halfShort: number;
}

/** Smallest rectangle aligned with one of the ring's edges (exact for convex rings). */
export const orientedRect = (ring: UtmRing): OrientedRect | null => {
  let best: (OrientedRect & { area: number }) | null = null;
  for (let k = 0; k + 1 < ring.length; k++) {
    const [ax, az] = ring[k] ?? [0, 0];
    const [bx, bz] = ring[k + 1] ?? [0, 0];
    const len = Math.hypot(bx - ax, bz - az);
    if (len < 1e-6) continue;
    const [ux, uz] = [(bx - ax) / len, (bz - az) / len];
    const us = ring.map(([e, n]) => e * ux + n * uz);
    const vs = ring.map(([e, n]) => -e * uz + n * ux);
    const [u0, u1, v0, v1] = [Math.min(...us), Math.max(...us), Math.min(...vs), Math.max(...vs)];
    const area = (u1 - u0) * (v1 - v0);
    if (best && area >= best.area) continue;
    const [uc, vc] = [(u0 + u1) / 2, (v0 + v1) / 2];
    const centre: UtmPoint = [uc * ux - vc * uz, uc * uz + vc * ux];
    const alongU = u1 - u0 >= v1 - v0;
    best = { area, centre, axis: alongU ? [ux, uz] : [-uz, ux], halfLong: Math.max(u1 - u0, v1 - v0) / 2, halfShort: Math.min(u1 - u0, v1 - v0) / 2 };
  }
  return best;
};

export const rectangularity = (ring: UtmRing): number => {
  const rect = orientedRect(ring);
  return rect ? ringArea(ring) / (4 * rect.halfLong * rect.halfShort || 1) : 0;
};

const cornersOf = ({ centre: [ce, cn], axis: [ux, uz], halfLong, halfShort }: OrientedRect): PitchedRoof['corners'] => {
  const at = (a: number, b: number): UtmPoint => [ce + ux * a - uz * b, cn + uz * a + ux * b];
  return [at(-halfLong, -halfShort), at(halfLong, -halfShort), at(halfLong, halfShort), at(-halfLong, halfShort)];
};

export interface RoofInput {
  readonly profile: FacadeProfile;
  readonly levels: number;
  /** Outer ring of a single-polygon footprint without holes; null otherwise. */
  readonly simpleRing: UtmRing | null;
  /** Pitched roofs are kept to buildings inside one tile (no cross-tile roof mesh). */
  readonly insideOneTile: boolean;
}

/** Shape and size allow a sheet roof: one simple polygon in one tile, low (except industry), small, rectangular. */
const sheetEligible = ({ profile, levels, simpleRing, insideOneTile }: RoofInput): boolean => {
  if (!simpleRing || !insideOneTile || (levels > 2 && profile !== 'industrial')) return false;
  return ringArea(simpleRing) <= (profile === 'industrial' ? 3000 : 600) && rectangularity(simpleRing) >= MIN_RECTANGULARITY;
};

export const chooseRoof = (input: RoofInput, rng: SeededRng): Roof => {
  const draw = rng.next();
  const { simpleRing } = input;
  if (!sheetEligible(input) || !simpleRing || draw >= SHEET_ODDS[input.profile]) return { kind: 'flat' };
  const rect = orientedRect(simpleRing);
  if (!rect) return { kind: 'flat' };
  const mono = rect.halfShort * 2 <= 6 ? rng.next() < 0.5 : rng.next() < 0.2;
  const short = 2 * rect.halfShort;
  const riseM = Math.round((mono ? short * MONO_SLOPE : (short / 2) * GABLE_SLOPE) * 100) / 100;
  return { kind: mono ? 'sheet-mono' : 'sheet-gable', corners: cornersOf(rect), riseM };
};
