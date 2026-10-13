/**
 * Role: tests instances.bin: round trip within quantization, unknown modules refused, 5 000-case fuzz with typed errors only.
 * Owner: backend
 */

import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { CollisionDecodeError } from '../collision/bounded-reader.ts';
import { INSTANCE_MODULES, moduleIndex } from './instance-catalogue.ts';
import { decodeInstances, encodeInstances } from './instances-codec.ts';

const instance = fc.record({
  module: fc.integer({ min: 0, max: INSTANCE_MODULES.length - 1 }),
  x: fc.float({ min: 0, max: 250, noNaN: true }),
  y: fc.float({ min: -5, max: 150, noNaN: true }),
  z: fc.float({ min: 0, max: 250, noNaN: true }),
  yawRad: fc.double({ min: 0, max: 6.28, noNaN: true }),
  scale: fc.double({ min: 0.5, max: 2, noNaN: true }),
  variant: fc.integer({ min: 0, max: 255 }),
});

describe('instances codec', () => {
  it('should round-trip within quantization', () => {
    fc.assert(
      fc.property(fc.array(instance, { maxLength: 50 }), (list) => {
        const out = decodeInstances(encodeInstances(list));
        return out.length === list.length && out.every((o, k) => {
          const i = list[k]!;
          return o.module === i.module && o.x === i.x && o.z === i.z && Math.abs(o.scale - i.scale) <= 0.5 / 170 + 1e-9 && o.variant === i.variant;
        });
      }),
    );
  });

  it('should refuse unknown modules', () => {
    expect(() => encodeInstances([{ module: 999, x: 0, y: 0, z: 0, yawRad: 0, scale: 1, variant: 0 }])).toThrow(RangeError);
    expect(moduleIndex('veg_tree_mango_a')).toBe(6);
  });

  it('should only throw typed errors on 5 000 mutated buffers', () => {
    const valid = encodeInstances([{ module: 1, x: 3, y: 0, z: 4, yawRad: 1, scale: 1, variant: 2 }]);
    fc.assert(
      fc.property(fc.nat(valid.length - 1), fc.integer({ min: 0, max: 255 }), fc.nat(valid.length), (at, byte, cut) => {
        const bytes = valid.slice(0, cut || valid.length);
        if (at < bytes.length) bytes[at] = byte;
        try {
          decodeInstances(bytes);
        } catch (error) {
          expect(error).toBeInstanceOf(CollisionDecodeError);
        }
      }),
      { numRuns: 5_000 },
    );
  });
});
