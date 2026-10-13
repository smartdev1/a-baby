/**
 * Role: tests the metre margin added around a WGS84 bounding box.
 * Owner: backend
 */

import { describe, expect, it } from 'vitest';
import { expandBbox } from './expand-bbox.ts';

describe('expandBbox', () => {
  it('should keep the bbox unchanged when the margin is 0', () => {
    expect(expandBbox([-4.175, 5.295, -4.005, 5.43], 0)).toEqual([-4.175, 5.295, -4.005, 5.43]);
  });

  it('should add about 300 m on each side near Abidjan', () => {
    const [west, south, east, north] = expandBbox([-4.1, 5.3, -4.0, 5.4], 300);
    expect(south).toBeCloseTo(5.3 - 0.002695, 5);
    expect(north).toBeCloseTo(5.4 + 0.002695, 5);
    expect(-4.1 - west).toBeGreaterThan(0.0027);
    expect(east + 4.0).toBeCloseTo(-4.1 - west, 6);
  });
});
