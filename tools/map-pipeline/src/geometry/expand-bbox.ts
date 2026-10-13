/**
 * Role: grows a WGS84 bounding box by a margin in metres (used to extract a commune plus its surroundings).
 * Owner: backend
 */

export type BboxLonLat = readonly [west: number, south: number, east: number, north: number];

const METRES_PER_DEGREE_LAT = 111_320;

/** Rounded to 1e-6° (~10 cm) so the osmium command line is stable across machines. */
const round6 = (value: number): number => Math.round(value * 1e6) / 1e6;

export const expandBbox = ([west, south, east, north]: BboxLonLat, marginM: number): BboxLonLat => {
  const dLat = marginM / METRES_PER_DEGREE_LAT;
  const maxAbsLatRad = (Math.max(Math.abs(south), Math.abs(north)) * Math.PI) / 180;
  const dLon = marginM / (METRES_PER_DEGREE_LAT * Math.cos(maxAbsLatRad));
  return [round6(west - dLon), round6(south - dLat), round6(east + dLon), round6(north + dLat)];
};
