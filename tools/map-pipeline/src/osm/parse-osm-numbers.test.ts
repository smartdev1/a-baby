/**
 * Role: tests numeric OSM tag parsing (levels and heights) on real-world messy values.
 * Owner: backend
 */

import { describe, expect, it } from 'vitest';
import { parseHeightM, parseLevels } from './parse-osm-numbers.ts';

describe('parseLevels', () => {
  it.each([
    ['3', 3],
    ['2;3', 3],
    ['R+2', 3],
    ['r + 4', 5],
    ['2.5', 3],
    ['2,5', 3],
  ])('should read "%s" as %d', (raw, expected) => {
    expect(parseLevels(raw)).toBe(expected);
  });

  it.each(['0', '75', 'abc', '', 'NaN', '-2'])('should drop invalid or implausible "%s"', (raw) => {
    expect(parseLevels(raw)).toBeUndefined();
  });

  it('should return undefined when the tag is missing', () => {
    expect(parseLevels(undefined)).toBeUndefined();
  });
});

describe('parseHeightM', () => {
  it.each([
    ['12', 12],
    ['12.5', 12.5],
    ['12,5 m', 12.5],
    ['12m', 12],
    ['40 ft', 12.19],
    ["40'", 12.19],
    ['9;12', 12],
  ])('should read "%s" as %d m', (raw, expected) => {
    expect(parseHeightM(raw)).toBe(expected);
  });

  it.each(['421', '1', 'tall', '12 storeys'])('should drop invalid or implausible "%s"', (raw) => {
    expect(parseHeightM(raw)).toBeUndefined();
  });
});
