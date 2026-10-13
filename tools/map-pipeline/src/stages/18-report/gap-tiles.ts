/**
 * Role: lists the L0 tiles whose centre is inside the commune but which hold no building, and counts them by land cover.
 * Owner: backend
 */

import { fromUtm30n, parseTileKey, tileBounds, tileKeyOf, toUtm30n } from '@skyline/geo';
import { bboxOf, containsPoint, type Geometry } from '../../geometry/geojson-geometry.ts';
import { COVER_CLASSES, type GapCover } from './gap-cover.ts';

const tileCentreLonLat = (key: string): readonly [number, number] => {
  const b = tileBounds(key);
  const { lonDeg, latDeg } = fromUtm30n({
    eastingM: (b.minEastingM + b.maxEastingM) / 2,
    northingM: (b.minNorthingM + b.maxNorthingM) / 2,
  });
  return [lonDeg, latDeg];
};

export const classifyGapTiles = (
  buildingsPerTile: Readonly<Record<string, number>>,
  boundary: Geometry,
  cover: GapCover,
): Record<string, number> => {
  const [west, south, east, north] = bboxOf(boundary);
  const sw = parseTileKey(tileKeyOf(toUtm30n({ lonDeg: west, latDeg: south }), 0));
  const ne = parseTileKey(tileKeyOf(toUtm30n({ lonDeg: east, latDeg: north }), 0));
  const counts: Record<string, number> = Object.fromEntries(COVER_CLASSES.map((c) => [c, 0]));

  for (let j = sw.j; j <= ne.j; j++) {
    for (let i = sw.i; i <= ne.i; i++) {
      const key = `L0_${i}_${j}`;
      if ((buildingsPerTile[key] ?? 0) > 0) continue;
      const centre = tileCentreLonLat(key);
      if (!containsPoint(boundary, centre)) continue;
      const kind = cover.classify(centre);
      counts[kind] = (counts[kind] ?? 0) + 1;
    }
  }
  return counts;
};
