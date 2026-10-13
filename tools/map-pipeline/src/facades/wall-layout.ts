/**
 * Role: wall and floor layout of a facade: bays of 2.5–4.5 m along each wall (nominal 3 m) and floors (ground floor 3.5 m, upper floors about 3 m) fitted to the building height.
 * Owner: backend
 */

export const NOMINAL_BAY_M = 3;
export const GROUND_FLOOR_M = 3.5;
export const UPPER_FLOOR_M = 3;
/** Shorter walls stay blank geometry. */
export const MIN_BAY_WALL_M = 2.5;
/** Lower buildings (sheds, low walls) get no facade modules. */
export const MIN_FACADE_HEIGHT_M = 2.8;
const MAX_FLOORS = 40;

export interface WallBays {
  readonly count: number;
  readonly widthM: number;
}

/** null when the wall is too short for a bay. */
export const wallBays = (lengthM: number): WallBays | null => {
  if (lengthM < MIN_BAY_WALL_M) return null;
  const count = Math.max(1, Math.round(lengthM / NOMINAL_BAY_M));
  return { count, widthM: lengthM / count };
};

export interface FloorLayout {
  /** Height of the ground floor (stretched alone when the building is low). */
  readonly groundM: number;
  readonly upperCount: number;
  readonly upperM: number;
}

/** null when the building is too low for facades. */
export const floorLayout = (heightM: number): FloorLayout | null => {
  if (heightM < MIN_FACADE_HEIGHT_M) return null;
  const above = heightM - GROUND_FLOOR_M;
  if (above < UPPER_FLOOR_M / 2) return { groundM: heightM, upperCount: 0, upperM: 0 };
  const upperCount = Math.min(MAX_FLOORS, Math.max(1, Math.round(above / UPPER_FLOOR_M)));
  return { groundM: GROUND_FLOOR_M, upperCount, upperM: above / upperCount };
};
