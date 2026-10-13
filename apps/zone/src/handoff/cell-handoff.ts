/**
 * Role: cell border crossing: detects when a player leaves the 1 km cell, builds the handoff message (absolute UTM state) and rebuilds the state in the receiving cell's frame.
 * Owner: backend
 */

import type { CellHandoff } from '@skyline/bus';
import { CELL_SIZE_M, cellKeyOf, isInsideGrid, type UtmPosition } from '@skyline/geo';
import type { CharacterState } from '@skyline/physics';

/** Key of the cell the player now stands in, or null while still inside this cell. */
export const leftCellTowards = (state: CharacterState, frameOrigin: UtmPosition): string | null => {
  const { x, z } = state.position;
  if (x >= 0 && x < CELL_SIZE_M && z >= 0 && z < CELL_SIZE_M) return null;
  const utm = { eastingM: frameOrigin.eastingM + x, northingM: frameOrigin.northingM + z };
  return isInsideGrid(utm) ? cellKeyOf(utm) : null;
};

export const toHandoff = (
  player: { sessionId: string; entityId: number; state: CharacterState; lastSeq: number; yawRad: number },
  frameOrigin: UtmPosition,
  nowMs: number,
): CellHandoff => ({
  sessionId: player.sessionId,
  entityId: player.entityId,
  eastingM: frameOrigin.eastingM + player.state.position.x,
  northingM: frameOrigin.northingM + player.state.position.z,
  y: player.state.position.y,
  velocity: player.state.velocity,
  grounded: player.state.grounded,
  lastSeq: player.lastSeq,
  yawRad: player.yawRad,
  sentAtMs: nowMs,
});

export const stateFromHandoff = (h: CellHandoff, frameOrigin: UtmPosition): CharacterState => ({
  position: { x: h.eastingM - frameOrigin.eastingM, y: h.y, z: h.northingM - frameOrigin.northingM },
  velocity: h.velocity,
  grounded: h.grounded,
});

/** Stable 32-bit entity id from the session id (FNV-1a): unique across all zone processes without coordination. */
export const entityIdOf = (sessionId: string): number => {
  let h = 2_166_136_261;
  for (let k = 0; k < sessionId.length; k++) h = Math.imul(h ^ sessionId.charCodeAt(k), 16_777_619) >>> 0;
  return h || 1;
};
