/**
 * Role: border ghosts (ARCHITECTURE §13.4): players within 200 m of a border are published read-only to the neighbour cells at 10 Hz in absolute UTM; each cell keeps the latest ghosts of every neighbour and merges them into its snapshot in its own frame, so clients near a border see the players on the other side.
 * Owner: backend
 */

import type { CellGhosts, GhostEntity } from '@skyline/bus';
import { cellBounds, CELL_SIZE_M, parseCellKey, type UtmPosition } from '@skyline/geo';
import type { EntityState } from '@skyline/protocol';

/** At least the largest interest radius (250 m in a vehicle comes later; 150 m on foot). */
export const GHOST_RADIUS_M = 200;
/** Ghosts of a neighbour older than this are dropped (it stopped publishing: no players near the border). */
const GHOST_TTL_MS = 500;

/** Neighbour cells whose area lies within `radiusM` of a UTM point. */
export const ghostTargets = (cellKey: string, p: UtmPosition, radiusM = GHOST_RADIUS_M): string[] => {
  const { i, j } = parseCellKey(cellKey);
  const out: string[] = [];
  for (let dj = -1; dj <= 1; dj++) {
    for (let di = -1; di <= 1; di++) {
      if ((di === 0 && dj === 0) || i + di < 0 || j + dj < 0) continue;
      const key = `C_${i + di}_${j + dj}`;
      const b = cellBounds(key);
      const dx = Math.max(b.minEastingM - p.eastingM, 0, p.eastingM - b.maxEastingM);
      const dz = Math.max(b.minNorthingM - p.northingM, 0, p.northingM - b.maxNorthingM);
      if (Math.hypot(dx, dz) <= radiusM) out.push(key);
    }
  }
  return out;
};

/** Cheap pre-check in frame metres: only players near a border can be ghosts. */
export const nearBorder = (x: number, z: number, radiusM = GHOST_RADIUS_M): boolean =>
  x < radiusM || z < radiusM || x > CELL_SIZE_M - radiusM || z > CELL_SIZE_M - radiusM;

export const toGhost = (e: EntityState, frameOrigin: UtmPosition): GhostEntity => ({
  id: e.id,
  eastingM: frameOrigin.eastingM + e.position.x,
  northingM: frameOrigin.northingM + e.position.z,
  y: e.position.y,
  yawRad: e.yawRad,
  state: e.state,
});

/** Latest ghosts received from each neighbour. */
export class GhostBoard {
  private readonly bySource = new Map<string, { atMs: number; entities: readonly GhostEntity[] }>();

  accept(message: CellGhosts, nowMs: number): void {
    this.bySource.set(message.fromCell, { atMs: nowMs, entities: message.entities });
  }

  /** Fresh ghosts in this cell's frame, without the entities the cell owns itself (e.g. right after a handoff). */
  entitiesIn(frameOrigin: UtmPosition, nowMs: number, owned: ReadonlySet<number>): EntityState[] {
    const out: EntityState[] = [];
    for (const [source, { atMs, entities }] of this.bySource) {
      if (nowMs - atMs > GHOST_TTL_MS) {
        this.bySource.delete(source);
        continue;
      }
      for (const g of entities) {
        if (owned.has(g.id)) continue;
        out.push({ id: g.id, position: { x: g.eastingM - frameOrigin.eastingM, y: g.y, z: g.northingM - frameOrigin.northingM }, yawRad: g.yawRad, state: g.state });
      }
    }
    return out;
  }
}
