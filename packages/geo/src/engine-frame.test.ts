/**
 * Role: tests the UTM ↔ engine frame conversion (x = east, y = up, z = north, floating origin).
 * Owner: backend
 */

import { describe, expect, it } from 'vitest';
import { fromEngine, toEngine } from './engine-frame.ts';

const ORIGIN = { eastingM: 381_000, northingM: 589_000 };

describe('toEngine', () => {
  it('should map east to +x, north to +z and altitude to y', () => {
    expect(toEngine({ eastingM: 381_010, northingM: 589_020 }, ORIGIN, 3)).toEqual({ x: 10, y: 3, z: 20 });
  });

  it('should be inverted by fromEngine', () => {
    const position = { eastingM: 381_253.2, northingM: 589_952.93 };
    expect(fromEngine(toEngine(position, ORIGIN), ORIGIN)).toEqual(position);
  });
});
