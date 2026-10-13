/**
 * Role: tests the seeded generator: reproducibility, seed independence, bounds and empty inputs.
 * Owner: backend
 */

import { describe, expect, it } from 'vitest';
import { createSeededRng, rngFor } from './seeded-rng.ts';

const sample = (seed: string, count: number): number[] => {
  const rng = createSeededRng(seed);
  return Array.from({ length: count }, () => rng.next());
};

describe('createSeededRng', () => {
  it('should produce the same sequence when the seed is the same', () => {
    expect(sample('yopougon-v1', 100)).toEqual(sample('yopougon-v1', 100));
  });

  it('should produce different sequences when seeds differ', () => {
    expect(sample('yopougon-v1', 10)).not.toEqual(sample('yopougon-v2', 10));
  });

  it('should stay in [0, 1) and spread values over the range', () => {
    const values = sample('spread', 10_000);
    expect(values.every((v) => v >= 0 && v < 1)).toBe(true);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    expect(mean).toBeGreaterThan(0.48);
    expect(mean).toBeLessThan(0.52);
  });

  it('should return integers inside the inclusive range when int is called', () => {
    const rng = createSeededRng('int');
    const values = Array.from({ length: 1000 }, () => rng.int(1, 3));
    expect(new Set(values)).toEqual(new Set([1, 2, 3]));
  });

  it('should throw when the range or the list is empty', () => {
    const rng = createSeededRng('empty');
    expect(() => rng.int(3, 1)).toThrow(RangeError);
    expect(() => rng.pick([])).toThrow(RangeError);
  });

  it('should derive stable per-object generators when rngFor is used', () => {
    expect(rngFor('seed', 'osm:way/1').next()).toBe(rngFor('seed', 'osm:way/1').next());
    expect(rngFor('seed', 'osm:way/1').next()).not.toBe(rngFor('seed', 'osm:way/2').next());
  });
});
