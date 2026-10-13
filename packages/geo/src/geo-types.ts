/**
 * Role: coordinate types shared by every geographic function (WGS84 degrees, UTM 30N metres, engine metres).
 * Owner: backend
 */

/** WGS84 geographic position in decimal degrees. */
export interface LonLat {
  readonly lonDeg: number;
  readonly latDeg: number;
}

/** UTM zone 30N (EPSG:32630) position in metres. */
export interface UtmPosition {
  readonly eastingM: number;
  readonly northingM: number;
}

/** Engine frame: x = east, y = up, z = north, metres relative to a floating origin. */
export interface EnginePosition {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/** Axis-aligned rectangle in UTM metres (min inclusive, max exclusive). */
export interface UtmBounds {
  readonly minEastingM: number;
  readonly minNorthingM: number;
  readonly maxEastingM: number;
  readonly maxNorthingM: number;
}
