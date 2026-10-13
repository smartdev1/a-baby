/**
 * Role: regression test of the writer growth: single writes landing exactly on a buffer growth must not use the old view.
 * Owner: backend
 */

import { describe, expect, it } from 'vitest';
import { GrowableWriter } from './growable-writer.ts';

describe('GrowableWriter', () => {
  it('should keep every value when many single writes cross several growths', () => {
    const writer = new GrowableWriter();
    for (let k = 0; k < 5_000; k++) writer.f32(k);
    for (let k = 0; k < 3_000; k++) writer.u16(k);
    const view = new DataView(writer.toBytes().buffer);
    expect(view.getFloat32(4 * 4_999, true)).toBe(4_999);
    expect(view.getUint16(20_000 + 2 * 2_999, true)).toBe(2_999);
  });
});
