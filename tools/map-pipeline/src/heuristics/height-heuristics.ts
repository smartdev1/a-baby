/**
 * Role: building height and level count v0: OSM `height` > `building:levels` > seeded heuristic by building type and footprint area (default profile, before neighbourhood profiles of J2).
 * Owner: backend
 */

import type { SeededRng } from '../determinism/seeded-rng.ts';

export type HeightSource = 'osm' | 'dataset' | 'heuristic';

export const GROUND_FLOOR_M = 3.5;
export const UPPER_FLOOR_M = 3;

/** Weighted level distribution: [levels, weight]. */
type LevelDistribution = readonly (readonly [number, number])[];

/** Types whose height is a range in metres rather than floors (single tall volume). */
const FIXED_HEIGHT_M: Readonly<Record<string, readonly [number, number]>> = {
  church: [9, 14],
  cathedral: [14, 22],
  chapel: [6, 9],
  mosque: [7, 11],
  industrial: [7, 12],
  warehouse: [7, 12],
  hangar: [6, 10],
  roof: [3, 4],
  shed: [2.5, 3.5],
  garage: [2.5, 3.5],
  garages: [2.5, 3.5],
  kiosk: [2.5, 3],
  hut: [2.5, 3.5],
};

const BY_TYPE: Readonly<Record<string, LevelDistribution>> = {
  apartments: [
    [3, 2],
    [4, 3],
    [5, 3],
    [6, 1],
  ],
  residential: [
    [1, 4],
    [2, 3],
    [3, 2],
    [4, 1],
  ],
  house: [
    [1, 7],
    [2, 3],
  ],
  detached: [
    [1, 7],
    [2, 3],
  ],
  terrace: [
    [1, 6],
    [2, 4],
  ],
  commercial: [
    [1, 3],
    [2, 4],
    [3, 2],
    [4, 1],
  ],
  retail: [
    [1, 4],
    [2, 4],
    [3, 2],
  ],
  office: [
    [2, 3],
    [3, 3],
    [4, 2],
    [6, 1],
  ],
  school: [
    [1, 5],
    [2, 4],
    [3, 1],
  ],
  college: [
    [1, 3],
    [2, 4],
    [3, 3],
  ],
  university: [
    [2, 4],
    [3, 4],
    [4, 2],
  ],
  hospital: [
    [1, 3],
    [2, 4],
    [3, 2],
    [4, 1],
  ],
  construction: [
    [1, 6],
    [2, 3],
    [3, 1],
  ],
};

/** `building=yes` (96 % of Yopougon): distribution by footprint area. */
const BY_AREA: readonly { maxAreaM2: number; levels: LevelDistribution }[] = [
  { maxAreaM2: 40, levels: [[1, 1]] },
  {
    maxAreaM2: 150,
    levels: [
      [1, 7],
      [2, 3],
    ],
  },
  {
    maxAreaM2: 400,
    levels: [
      [1, 4],
      [2, 4],
      [3, 2],
    ],
  },
  {
    maxAreaM2: 1000,
    levels: [
      [2, 4],
      [3, 4],
      [4, 2],
    ],
  },
  {
    maxAreaM2: Infinity,
    levels: [
      [1, 3],
      [2, 3],
      [3, 2],
      [4, 2],
    ],
  },
];

export interface HeightInput {
  readonly type: string;
  readonly footprintAreaM2: number;
  readonly osmLevels?: number;
  readonly osmHeightM?: number;
}

export interface HeightResult {
  readonly levels: number;
  readonly heightM: number;
  readonly heightSource: HeightSource;
}

const round2 = (v: number): number => Math.round(v * 100) / 100;

export const heightFromLevels = (levels: number): number => round2(GROUND_FLOOR_M + (levels - 1) * UPPER_FLOOR_M);
const levelsFromHeight = (heightM: number): number =>
  Math.max(1, Math.round((heightM - GROUND_FLOOR_M) / UPPER_FLOOR_M) + 1);

const drawLevels = (distribution: LevelDistribution, rng: SeededRng): number => {
  const total = distribution.reduce((s, [, w]) => s + w, 0);
  let ticket = rng.next() * total;
  for (const [levels, weight] of distribution) {
    ticket -= weight;
    if (ticket < 0) return levels;
  }
  return distribution[distribution.length - 1]?.[0] ?? 1;
};

const heuristic = ({ type, footprintAreaM2 }: HeightInput, rng: SeededRng): HeightResult => {
  const fixed = FIXED_HEIGHT_M[type];
  if (fixed)
    return { levels: 1, heightM: round2(fixed[0] + rng.next() * (fixed[1] - fixed[0])), heightSource: 'heuristic' };
  const distribution = BY_TYPE[type] ?? BY_AREA.find((b) => footprintAreaM2 <= b.maxAreaM2)?.levels ?? [[1, 1]];
  const levels = drawLevels(distribution, rng);
  return { levels, heightM: heightFromLevels(levels), heightSource: 'heuristic' };
};

/** `rng` must be derived from the pipeline seed and the building OSM id (same building ⇒ same height). */
export const resolveHeight = (input: HeightInput, rng: SeededRng): HeightResult => {
  if (input.osmHeightM !== undefined) {
    return {
      levels: input.osmLevels ?? levelsFromHeight(input.osmHeightM),
      heightM: input.osmHeightM,
      heightSource: 'osm',
    };
  }
  if (input.osmLevels !== undefined)
    return { levels: input.osmLevels, heightM: heightFromLevels(input.osmLevels), heightSource: 'osm' };
  return heuristic(input, rng);
};
