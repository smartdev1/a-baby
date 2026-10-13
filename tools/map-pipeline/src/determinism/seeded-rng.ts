/**
 * Role: deterministic pseudo-random generator (string seed → sfc32) used instead of Math.random by every pipeline stage.
 * Owner: backend
 */

export interface SeededRng {
  /** Float in [0, 1). */
  next(): number;
  /** Integer in [minInclusive, maxInclusive]. */
  int(minInclusive: number, maxInclusive: number): number;
  /** One element of a non-empty list. */
  pick<T>(items: readonly T[]): T;
}

/** xmur3 string hash: turns a seed string into a stream of 32-bit seeds. */
const xmur3 = (seed: string): (() => number) => {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
};

/** sfc32: small, fast, good-quality 32-bit generator. */
const sfc32 = (a0: number, b0: number, c0: number, d0: number): (() => number) => {
  let [a, b, c, d] = [a0, b0, c0, d0];
  return () => {
    a >>>= 0;
    b >>>= 0;
    c >>>= 0;
    d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
};

/** Same seed → same sequence, on every machine. */
export const createSeededRng = (seed: string): SeededRng => {
  const seeder = xmur3(seed);
  const next = sfc32(seeder(), seeder(), seeder(), seeder());
  return {
    next,
    int: (minInclusive, maxInclusive) => {
      if (maxInclusive < minInclusive) throw new RangeError(`empty range [${minInclusive}, ${maxInclusive}]`);
      return minInclusive + Math.floor(next() * (maxInclusive - minInclusive + 1));
    },
    pick: (items) => {
      const item = items[Math.floor(next() * items.length)];
      if (item === undefined) throw new RangeError('cannot pick from an empty list');
      return item;
    },
  };
};

/** Derives a per-object generator, e.g. `rngFor(config.seed, 'osm:way/558265139')`. */
export const rngFor = (pipelineSeed: string, objectId: string): SeededRng =>
  createSeededRng(`${pipelineSeed}|${objectId}`);
