/**
 * Role: tests tile keys on the fixed grid: key computation, bounds inversion, parsing, parent/children and grid limits.
 * Owner: backend
 */

import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { childTileKeys, parentTileKey, parseTileKey, tileBounds, tileKeyOf } from './tile-keys.ts';
import { GRID_BOUNDS, GRID_ORIGIN, TILE_LEVELS, type TileLevel } from './world-grid.ts';

const gridPosition = fc.record({
  eastingM: fc.double({ min: GRID_BOUNDS.minEastingM, max: GRID_BOUNDS.maxEastingM - 0.001, noNaN: true }),
  northingM: fc.double({ min: GRID_BOUNDS.minNorthingM, max: GRID_BOUNDS.maxNorthingM - 0.001, noNaN: true }),
});
const level = fc.constantFrom(...TILE_LEVELS);

describe('tileKeyOf', () => {
  it('should return L0_0_0 when the position is the grid origin', () => {
    expect(tileKeyOf(GRID_ORIGIN, 0)).toBe('L0_0_0');
  });

  it('should give the tile of the Yopougon town hall area when converting its UTM position', () => {
    // E 381 253.2 → (81 253.2 / 250) = 325 ; N 589 952.93 → (49 952.93 / 250) = 199
    expect(tileKeyOf({ eastingM: 381_253.2, northingM: 589_952.93 }, 0)).toBe('L0_325_199');
  });

  it('should throw when the position is outside the world grid', () => {
    expect(() => tileKeyOf({ eastingM: 0, northingM: 0 }, 0)).toThrow(RangeError);
  });

  it('should return a tile whose bounds contain the position for any level', () => {
    fc.assert(
      fc.property(gridPosition, level, (position, tileLevel: TileLevel) => {
        const b = tileBounds(tileKeyOf(position, tileLevel));
        return (
          position.eastingM >= b.minEastingM &&
          position.eastingM < b.maxEastingM &&
          position.northingM >= b.minNorthingM &&
          position.northingM < b.maxNorthingM
        );
      }),
      { numRuns: 5_000 },
    );
  });
});

describe('parseTileKey', () => {
  it('should parse a valid key', () => {
    expect(parseTileKey('L2_40_12')).toEqual({ level: 2, i: 40, j: 12 });
  });

  it.each(['L4_1_1', 'L0_-1_2', 'C_1_1', 'L0_1', ''])('should reject "%s"', (key) => {
    expect(() => parseTileKey(key)).toThrow(SyntaxError);
  });
});

describe('parentTileKey and childTileKeys', () => {
  it('should be consistent: every child has the tile as parent', () => {
    for (const child of childTileKeys('L2_7_9')) expect(parentTileKey(child)).toBe('L2_7_9');
  });

  it('should return 4 children for L1 and none for L0', () => {
    expect(childTileKeys('L1_3_3')).toEqual(['L0_6_6', 'L0_7_6', 'L0_6_7', 'L0_7_7']);
    expect(childTileKeys('L0_3_3')).toEqual([]);
  });

  it('should return no parent for the coarsest level', () => {
    expect(parentTileKey('L3_1_1')).toBeNull();
  });
});
