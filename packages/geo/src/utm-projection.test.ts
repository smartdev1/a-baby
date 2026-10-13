/**
 * Role: tests the UTM 30N projection against PROJ reference values and with round-trip properties over the Abidjan District.
 * Owner: backend
 */

import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { fromUtm30n, toUtm30n } from './utm-projection.ts';

/** Reference values computed with PROJ 9.8.1 (pyproj), EPSG:4326 → EPSG:32630, on 2026-10-13. */
const PROJ_REFERENCES = [
  { name: 'Yopougon town hall area', lonDeg: -4.0717, latDeg: 5.3364, eastingM: 381_253.2, northingM: 589_952.93 },
  { name: 'Plateau', lonDeg: -4.0167, latDeg: 5.3197, eastingM: 387_344.933, northingM: 588_096.299 },
  { name: 'District south-west', lonDeg: -4.7, latDeg: 5.0, eastingM: 311_520.191, northingM: 552_908.052 },
  { name: 'District north-east', lonDeg: -3.7, latDeg: 5.8, eastingM: 422_501.73, northingM: 641_144.055 },
] as const;

const CENTIMETRE = 0.01;
/** 1 cm expressed in degrees at the equator (upper bound for Abidjan latitudes). */
const CENTIMETRE_DEG = CENTIMETRE / 111_320;

const districtLonLat = fc.record({
  lonDeg: fc.double({ min: -4.7, max: -3.7, noNaN: true }),
  latDeg: fc.double({ min: 5.0, max: 5.8, noNaN: true }),
});

describe('toUtm30n', () => {
  it.each(PROJ_REFERENCES)('should match PROJ to the centimetre when converting $name', (ref) => {
    const utm = toUtm30n(ref);
    expect(Math.abs(utm.eastingM - ref.eastingM)).toBeLessThan(CENTIMETRE);
    expect(Math.abs(utm.northingM - ref.northingM)).toBeLessThan(CENTIMETRE);
  });
});

describe('fromUtm30n', () => {
  it.each(PROJ_REFERENCES)('should match PROJ when converting $name back', (ref) => {
    const lonLat = fromUtm30n(ref);
    expect(Math.abs(lonLat.lonDeg - ref.lonDeg)).toBeLessThan(CENTIMETRE_DEG);
    expect(Math.abs(lonLat.latDeg - ref.latDeg)).toBeLessThan(CENTIMETRE_DEG);
  });

  it('should round-trip within 1 cm when converting any District point to UTM and back', () => {
    fc.assert(
      fc.property(districtLonLat, (point) => {
        const back = fromUtm30n(toUtm30n(point));
        return (
          Math.abs(back.lonDeg - point.lonDeg) < CENTIMETRE_DEG && Math.abs(back.latDeg - point.latDeg) < CENTIMETRE_DEG
        );
      }),
      { numRuns: 10_000 },
    );
  });
});
