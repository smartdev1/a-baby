/**
 * Role: seeded profile grammar of facades: weighted module choices for ground-floor bays (street side or not) and upper-floor columns of each profile.
 * Owner: backend
 */

import type { InstanceModule } from '@skyline/tile-format';
import type { SeededRng } from '../determinism/seeded-rng.ts';
import type { FacadeProfile } from './facade-profile.ts';

type Weights = readonly (readonly [InstanceModule, number])[];

/** Ground floor on a street: shops on commercial streets, mostly closed walls elsewhere. */
const GROUND_STREET: Readonly<Record<FacadeProfile, Weights>> = {
  commercial: [['bld_shopfront_shutter_a', 5], ['bld_shopfront_open_a', 3], ['bld_gf_window_a', 1]],
  apartments: [['bld_shopfront_shutter_a', 4], ['bld_shopfront_open_a', 2], ['bld_gf_window_a', 3], ['bld_gf_wall_plain_a', 1]],
  courtyard: [['bld_gf_wall_plain_a', 4], ['bld_gf_window_a', 3], ['bld_shopfront_shutter_a', 2], ['bld_shopfront_open_a', 1]],
  public: [['bld_gf_window_a', 6], ['bld_gf_wall_plain_a', 4]],
  industrial: [['bld_gf_wall_plain_a', 9], ['bld_gf_window_a', 1]],
};

const GROUND_SIDE: Readonly<Record<FacadeProfile, Weights>> = {
  commercial: [['bld_gf_wall_plain_a', 5], ['bld_gf_window_a', 4], ['bld_shopfront_shutter_a', 1]],
  apartments: [['bld_gf_window_a', 6], ['bld_gf_wall_plain_a', 4]],
  courtyard: [['bld_gf_wall_plain_a', 5], ['bld_gf_window_a', 5]],
  public: [['bld_gf_window_a', 6], ['bld_gf_wall_plain_a', 4]],
  industrial: [['bld_gf_wall_plain_a', 1]],
};

const UPPER: Readonly<Record<FacadeProfile, Weights>> = {
  commercial: [['bld_wall_window_a', 4], ['bld_wall_window_b', 3], ['bld_wall_plain_a', 2], ['bld_balcony_a', 1]],
  apartments: [['bld_wall_window_a', 4], ['bld_wall_window_b', 2], ['bld_balcony_a', 3], ['bld_wall_plain_a', 1]],
  courtyard: [['bld_wall_window_a', 4], ['bld_wall_window_b', 3], ['bld_wall_plain_a', 2], ['bld_balcony_a', 1]],
  public: [['bld_wall_window_a', 6], ['bld_wall_window_b', 2], ['bld_wall_plain_a', 2]],
  industrial: [['bld_wall_plain_a', 8], ['bld_wall_window_b', 2]],
};

const pickWeighted = (rng: SeededRng, weights: Weights): InstanceModule => {
  const total = weights.reduce((s, [, w]) => s + w, 0);
  let roll = rng.next() * total;
  for (const [module, w] of weights) {
    roll -= w;
    if (roll < 0) return module;
  }
  return weights[weights.length - 1]?.[0] ?? 'bld_gf_wall_plain_a';
};

export const groundBay = (profile: FacadeProfile, streetSide: boolean, rng: SeededRng): InstanceModule => pickWeighted(rng, (streetSide ? GROUND_STREET : GROUND_SIDE)[profile]);

/** One module per upper-floor column (same on every floor, as built). Balconies only face a street or belong to apartment blocks. */
export const upperColumn = (profile: FacadeProfile, streetSide: boolean, rng: SeededRng): InstanceModule => {
  const module = pickWeighted(rng, UPPER[profile]);
  return module === 'bld_balcony_a' && !streetSide && profile !== 'apartments' ? 'bld_wall_window_a' : module;
};

/** The entrance bay: a gate into the courtyard, a metal door elsewhere (shops already open on the street). */
export const entranceBay = (profile: FacadeProfile): InstanceModule | null => {
  if (profile === 'commercial') return null;
  return profile === 'courtyard' || profile === 'industrial' ? 'bld_gate_metal_a' : 'bld_door_metal_a';
};
