/**
 * Role: tests collision.bin: encode/decode round trip (fast-check), typed errors on corrupted input and a 10 000-case fuzz without crash.
 * Owner: backend
 */

import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { CollisionDecodeError } from './bounded-reader.ts';
import { type CollisionData, decodeCollision, encodeCollision } from './collision-codec.ts';

const f32 = fc.float({ noNaN: true, noDefaultInfinity: true, min: -1000, max: 1000 });

const collisionData: fc.Arbitrary<CollisionData> = fc
  .record({
    resolution: fc.integer({ min: 2, max: 9 }),
    cellSizeM: fc.float({ min: Math.fround(0.5), max: 50, noNaN: true }),
    prisms: fc.array(
      fc.record({ base: f32, extra: fc.float({ min: 0, max: 100, noNaN: true }), ring: fc.array(f32, { minLength: 6, maxLength: 40 }) }),
      { maxLength: 20 },
    ),
  })
  .chain(({ resolution, cellSizeM, prisms }) =>
    fc.array(f32, { minLength: resolution * resolution, maxLength: resolution * resolution }).map((heights) => ({
      heightField: { resolution, cellSizeM, heightsM: Float32Array.from(heights) },
      prisms: prisms.map((p) => {
        const ring = p.ring.length % 2 === 0 ? p.ring : p.ring.slice(1);
        const baseYM = Math.fround(p.base);
        return { baseYM, topYM: Math.max(baseYM, Math.fround(p.base + p.extra)), ring: Float32Array.from(ring) };
      }),
      water: resolution % 2 === 0 ? { levelM: 0, cellsPerSide: resolution - 1, mask: new Uint8Array(Math.ceil(((resolution - 1) ** 2) / 8)).fill(0b10100101) } : null,
    })),
  );

const SAMPLE: CollisionData = {
  heightField: { resolution: 2, cellSizeM: 250, heightsM: Float32Array.from([1, 2, 3, 4]) },
  prisms: [{ baseYM: 0, topYM: 6, ring: Float32Array.from([0, 0, 10, 0, 10, 8]) }],
  water: { levelM: 0.5, cellsPerSide: 1, mask: Uint8Array.from([1]) },
};

describe('collision codec', () => {
  it('should decode exactly what was encoded', () => {
    fc.assert(
      fc.property(collisionData, (data) => {
        expect(decodeCollision(encodeCollision(data))).toEqual(data);
      }),
      { numRuns: 300 },
    );
  });

  it.each([
    ['truncated', (b: Uint8Array) => b.slice(0, b.length - 3)],
    ['bad-magic', (b: Uint8Array) => Uint8Array.from([0x58, ...b.slice(1)])],
    ['trailing-bytes', (b: Uint8Array) => Uint8Array.from([...b, 0])],
  ] as const)('should throw a typed "%s" error', (code, corrupt) => {
    const error = (() => {
      try {
        decodeCollision(corrupt(encodeCollision(SAMPLE)));
      } catch (e) {
        return e;
      }
      return null;
    })();
    expect(error).toBeInstanceOf(CollisionDecodeError);
    expect((error as CollisionDecodeError).code).toBe(code);
  });

  it('should refuse to encode inconsistent data', () => {
    expect(() => encodeCollision({ ...SAMPLE, prisms: [{ baseYM: 5, topYM: 1, ring: Float32Array.from([0, 0, 1, 0, 1, 1]) }] })).toThrow();
    expect(() => encodeCollision({ ...SAMPLE, heightField: { ...SAMPLE.heightField, heightsM: Float32Array.from([1]) } })).toThrow();
  });

  it('should never crash or over-read on 10 000 random or mutated inputs', () => {
    const valid = encodeCollision(SAMPLE);
    const mutated = fc.tuple(fc.integer({ min: 0, max: valid.length - 1 }), fc.integer({ min: 0, max: 255 }), fc.integer({ min: 0, max: valid.length })).map(
      ([at, byte, cut]) => {
        const copy = valid.slice(0, cut);
        if (at < copy.length) copy[at] = byte;
        return copy;
      },
    );
    fc.assert(
      fc.property(fc.oneof(fc.uint8Array({ maxLength: 256 }), mutated), (bytes) => {
        try {
          decodeCollision(bytes);
        } catch (error) {
          expect(error).toBeInstanceOf(CollisionDecodeError);
        }
      }),
      { numRuns: 10_000 },
    );
  });
});
