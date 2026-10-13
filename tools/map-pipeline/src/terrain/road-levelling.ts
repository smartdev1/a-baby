/**
 * Role: flattens the ground under carriageways: grid cells within half the road width (+1 m) take the height interpolated along the road segment.
 * Owner: backend
 */

import type { RoadEdge } from '../roads/road-graph-types.ts';
import type { HeightGrid } from './height-grid.ts';

const MARGIN_M = 1;

export const levelRoads = (grid: HeightGrid, edges: readonly Pick<RoadEdge, 'geometry' | 'widthM' | 'layer'>[]): number => {
  let levelled = 0;
  for (const edge of edges) {
    if (edge.layer !== 0) continue; // bridges and tunnels do not shape the ground
    const reach = edge.widthM / 2 + MARGIN_M;
    for (let k = 1; k < edge.geometry.length; k++) {
      const a = edge.geometry[k - 1];
      const b = edge.geometry[k];
      if (!a || !b) continue;
      const ha = grid.sample(a[0], a[1]);
      const hb = grid.sample(b[0], b[1]);
      const dx = b[0] - a[0];
      const dz = b[1] - a[1];
      const len2 = dx * dx + dz * dz || 1;
      const c0 = Math.floor((Math.min(a[0], b[0]) - reach - grid.minE) / grid.cellM);
      const c1 = Math.ceil((Math.max(a[0], b[0]) + reach - grid.minE) / grid.cellM);
      const r0 = Math.floor((Math.min(a[1], b[1]) - reach - grid.minN) / grid.cellM);
      const r1 = Math.ceil((Math.max(a[1], b[1]) + reach - grid.minN) / grid.cellM);
      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          const [e, n] = grid.centre(c, r);
          const t = Math.max(0, Math.min(1, ((e - a[0]) * dx + (n - a[1]) * dz) / len2));
          if (Math.hypot(e - (a[0] + dx * t), n - (a[1] + dz * t)) > reach) continue;
          grid.set(c, r, ha + (hb - ha) * t);
          levelled++;
        }
      }
    }
  }
  return levelled;
};
