/**
 * Role: WGS84 ellipsoid and UTM zone 30N constants, with the Krüger series coefficients derived from them.
 * Owner: backend
 */

const SEMI_MAJOR_AXIS_M = 6_378_137;
const FLATTENING = 1 / 298.257223563;

/** Third flattening n = f / (2 - f). */
const N = FLATTENING / (2 - FLATTENING);
const N2 = N * N;
const N3 = N2 * N;

export const UTM_30N = {
  scaleFactor: 0.9996,
  falseEastingM: 500_000,
  falseNorthingM: 0,
  /** Central meridian of zone 30: 3° West. */
  centralMeridianRad: (-3 * Math.PI) / 180,
} as const;

/** Rectifying radius A = a / (1 + n) * (1 + n²/4 + n⁴/64). */
export const RECTIFYING_RADIUS_M = (SEMI_MAJOR_AXIS_M / (1 + N)) * (1 + N2 / 4 + (N2 * N2) / 64);

/** 2√n / (1 + n), used by the conformal latitude. */
export const CONFORMAL_FACTOR = (2 * Math.sqrt(N)) / (1 + N);

/** Forward series (geodetic → projected). */
export const ALPHA = [N / 2 - (2 / 3) * N2 + (5 / 16) * N3, (13 / 48) * N2 - (3 / 5) * N3, (61 / 240) * N3] as const;

/** Inverse series (projected → rectifying). */
export const BETA = [N / 2 - (2 / 3) * N2 + (37 / 96) * N3, N2 / 48 + N3 / 15, (17 / 480) * N3] as const;

/** Conformal → geodetic latitude series. */
export const DELTA = [2 * N - (2 / 3) * N2 - 2 * N3, (7 / 3) * N2 - (8 / 5) * N3, (56 / 15) * N3] as const;
