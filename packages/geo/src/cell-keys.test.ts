/**
 * Role: tests server cell keys: alignment on the tile grid, tile membership and key parsing.
 * Owner: backend
 */

import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { cellBounds, cellKeyOf, parseCellKey, tilesOfCell } from './cell-keys.ts';
import { tileBounds, tileKeyOf } from './tile-keys.ts';
import { GRID_BOUNDS } from './world-grid.ts';

const gridPosition = fc.record({
  eastingM: fc.double({ min: GRID_BOUNDS.minEastingM, max: GRID_BOUNDS.maxEastingM - 0.001, noNaN: true }),
  northingM: fc.double({ min: GRID_BOUNDS.minNorthingM, max: GRID_BOUNDS.maxNorthingM - 0.001, noNaN: true }),
});

describe('cellKeyOf', () => {
  it('should put the L0 tile of a position inside the cell of the same position', () => {
    fc.assert(
      fc.property(gridPosition, (position) => tilesOfCell(cellKeyOf(position)).includes(tileKeyOf(position, 0))),
      { numRuns: 5_000 },
    );
  });

  it('should align cell bounds on L0 tile bounds', () => {
    const cell = cellBounds('C_81_49');
    const tiles = tilesOfCell('C_81_49').map(tileBounds);
    expect(Math.min(...tiles.map((t) => t.minEastingM))).toBe(cell.minEastingM);
    expect(Math.max(...tiles.map((t) => t.maxEastingM))).toBe(cell.maxEastingM);
    expect(Math.min(...tiles.map((t) => t.minNorthingM))).toBe(cell.minNorthingM);
    expect(Math.max(...tiles.map((t) => t.maxNorthingM))).toBe(cell.maxNorthingM);
  });

  it('should group 16 tiles per cell', () => {
    expect(tilesOfCell('C_0_0')).toHaveLength(16);
  });
});

describe('parseCellKey', () => {
  it('should reject a tile key', () => {
    expect(() => parseCellKey('L0_1_1')).toThrow(SyntaxError);
  });
});
