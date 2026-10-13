/**
 * Role: converts WGS84 degrees to UTM zone 30N metres and back (Krüger series, sub-millimetre near Abidjan).
 * Owner: backend
 */

import type { LonLat, UtmPosition } from './geo-types.ts';
import { ALPHA, BETA, CONFORMAL_FACTOR, DELTA, RECTIFYING_RADIUS_M, UTM_30N } from './utm-zone-30n.ts';

const DEG = Math.PI / 180;
const K0_A = UTM_30N.scaleFactor * RECTIFYING_RADIUS_M;

export const toUtm30n = ({ lonDeg, latDeg }: LonLat): UtmPosition => {
  const lat = latDeg * DEG;
  const dLon = lonDeg * DEG - UTM_30N.centralMeridianRad;
  const sinLat = Math.sin(lat);
  const t = Math.sinh(Math.atanh(sinLat) - CONFORMAL_FACTOR * Math.atanh(CONFORMAL_FACTOR * sinLat));
  const xi = Math.atan2(t, Math.cos(dLon));
  const eta = Math.atanh(Math.sin(dLon) / Math.sqrt(1 + t * t));

  let easting = eta;
  let northing = xi;
  ALPHA.forEach((alpha, index) => {
    const k = 2 * (index + 1);
    easting += alpha * Math.cos(k * xi) * Math.sinh(k * eta);
    northing += alpha * Math.sin(k * xi) * Math.cosh(k * eta);
  });

  return {
    eastingM: UTM_30N.falseEastingM + K0_A * easting,
    northingM: UTM_30N.falseNorthingM + K0_A * northing,
  };
};

export const fromUtm30n = ({ eastingM, northingM }: UtmPosition): LonLat => {
  const xi = (northingM - UTM_30N.falseNorthingM) / K0_A;
  const eta = (eastingM - UTM_30N.falseEastingM) / K0_A;

  let xiPrime = xi;
  let etaPrime = eta;
  BETA.forEach((beta, index) => {
    const k = 2 * (index + 1);
    xiPrime -= beta * Math.sin(k * xi) * Math.cosh(k * eta);
    etaPrime -= beta * Math.cos(k * xi) * Math.sinh(k * eta);
  });

  const chi = Math.asin(Math.sin(xiPrime) / Math.cosh(etaPrime));
  let lat = chi;
  DELTA.forEach((delta, index) => {
    lat += delta * Math.sin(2 * (index + 1) * chi);
  });
  const lon = UTM_30N.centralMeridianRad + Math.atan2(Math.sinh(etaPrime), Math.cos(xiPrime));

  return { lonDeg: lon / DEG, latDeg: lat / DEG };
};
