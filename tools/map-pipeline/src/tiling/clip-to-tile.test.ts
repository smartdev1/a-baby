/**
 * Role: tests tile clipping: polygons inside a tile are kept exactly, polygons and polylines crossing a border are cut at the border.
 * Owner: backend
 */

import { describe, expect, it } from 'vitest';
import type { UtmRing } from '../records/map-records.ts';
import { clipPolygonsToTile, clipPolylineToTile } from './clip-to-tile.ts';

const ORIGIN = { eastingM: 381_000, northingM: 589_000 };
const ring = (pts: [number, number][]): UtmRing =>
  pts.map(([x, z]) => [ORIGIN.eastingM + x, ORIGIN.northingM + z] as const);

describe('clipPolygonsToTile', () => {
  it('should keep an L-shaped footprint inside the tile vertex for vertex', () => {
    const l = ring([
      [10, 10],
      [40, 10],
      [40, 20],
      [20, 20],
      [20, 40],
      [10, 40],
      [10, 10],
    ]);
    expect(clipPolygonsToTile([[l]], ORIGIN)).toEqual([
      [
        [
          [10, 10],
          [40, 10],
          [40, 20],
          [20, 20],
          [20, 40],
          [10, 40],
          [10, 10],
        ],
      ],
    ]);
  });

  it('should cut a footprint crossing the east border at x = 250', () => {
    const crossing = ring([
      [240, 10],
      [260, 10],
      [260, 20],
      [240, 20],
      [240, 10],
    ]);
    const [polygon] = clipPolygonsToTile([[crossing]], ORIGIN);
    const xs = (polygon?.[0] ?? []).map(([x]) => x);
    expect(Math.max(...xs)).toBe(250);
    expect(Math.min(...xs)).toBe(240);
  });
});

describe('clipPolylineToTile', () => {
  it('should cut a road entering and leaving the tile', () => {
    const road = [
      [-10, 50],
      [100, 50],
      [300, 50],
    ].map(([x, z]) => [ORIGIN.eastingM + (x ?? 0), ORIGIN.northingM + (z ?? 0)] as const);
    expect(clipPolylineToTile(road, ORIGIN)).toEqual([
      [
        [0, 50],
        [100, 50],
        [250, 50],
      ],
    ]);
  });

  it('should return several pieces when the line leaves and re-enters', () => {
    const road = [
      [10, 10],
      [10, 300],
      [20, 300],
      [20, 10],
    ].map(([x, z]) => [ORIGIN.eastingM + (x ?? 0), ORIGIN.northingM + (z ?? 0)] as const);
    expect(clipPolylineToTile(road, ORIGIN)).toHaveLength(2);
  });

  it('should return nothing for a line fully outside', () => {
    const road = [
      [300, 10],
      [400, 10],
    ].map(([x, z]) => [ORIGIN.eastingM + (x ?? 0), ORIGIN.northingM + (z ?? 0)] as const);
    expect(clipPolylineToTile(road, ORIGIN)).toEqual([]);
  });
});
