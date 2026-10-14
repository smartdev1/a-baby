/**
 * Role: tests border ghosts: neighbour cells within the ghost radius (sides and corners), conversion between cell frames, expiry of stale ghosts and exclusion of entities the cell owns.
 * Owner: backend
 */

import { cellBounds } from '@skyline/geo';
import { describe, expect, it } from 'vitest';
import { GhostBoard, ghostTargets, nearBorder } from './cell-ghosts.ts';

const CELL = 'C_81_49';
const b = cellBounds(CELL);

describe('cell ghosts', () => {
  it('should target the neighbours within 200 m, corners included', () => {
    expect(ghostTargets(CELL, { eastingM: b.minEastingM + 500, northingM: b.minNorthingM + 500 })).toEqual([]);
    expect(ghostTargets(CELL, { eastingM: b.maxEastingM - 50, northingM: b.minNorthingM + 500 })).toEqual(['C_82_49']);
    expect(ghostTargets(CELL, { eastingM: b.maxEastingM - 50, northingM: b.maxNorthingM - 50 })).toEqual(['C_82_49', 'C_81_50', 'C_82_50']);
    expect(nearBorder(500, 500)).toBe(false);
    expect(nearBorder(950, 500)).toBe(true);
  });

  it('should give fresh ghosts in the receiving frame, without owned entities', () => {
    const board = new GhostBoard();
    const ghost = (id: number) => ({ id, eastingM: b.maxEastingM - 10, northingM: b.minNorthingM + 300, y: 1, yawRad: 0, state: 0 });
    board.accept({ fromCell: CELL, entities: [ghost(1), ghost(2)] }, 1000);
    const eastOrigin = { eastingM: b.maxEastingM, northingM: b.minNorthingM };
    expect(board.entitiesIn(eastOrigin, 1200, new Set([2]))).toEqual([{ id: 1, position: { x: -10, y: 1, z: 300 }, yawRad: 0, state: 0 }]);
    expect(board.entitiesIn(eastOrigin, 1600, new Set())).toEqual([]);
  });
});
