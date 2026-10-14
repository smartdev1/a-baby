/**
 * Role: building block impostors of a coarse tile: footprints are sampled on a fine lattice, each grid cell with enough built area becomes one box (side from the built share, height from the mean building height).
 * Owner: backend
 */

import type { LocalPoint, TileBuildingPart } from '../tiling/tile-content.ts';

export interface BlockGrid {
  /** Coarse tile side and grid cell side (metres). */
  readonly sizeM: number;
  readonly cellM: number;
}

/** A building part already moved into the coarse tile frame (outer rings only). */
export interface FramedPart {
  readonly rings: readonly (readonly LocalPoint[])[];
  readonly topYM: number;
}

const SAMPLES_PER_CELL_SIDE = 4;
/** Below this built share a cell stays empty (gardens, yards, streets). */
const MIN_BUILT_SHARE = 0.18;

const inRing = (ring: readonly LocalPoint[], x: number, z: number): boolean => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, zi] = ring[i] ?? [0, 0];
    const [xj, zj] = ring[j] ?? [0, 0];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
};

interface CellAccumulator {
  hits: number;
  topSum: number;
}

/** Built share and mean roof height per grid cell. */
const sampleCells = (parts: readonly FramedPart[], grid: BlockGrid): Map<number, CellAccumulator> => {
  const cells = Math.round(grid.sizeM / grid.cellM);
  const step = grid.cellM / SAMPLES_PER_CELL_SIDE;
  const acc = new Map<number, CellAccumulator>();
  for (const part of parts) {
    for (const ring of part.rings) {
      const xs = ring.map((p) => p[0]);
      const zs = ring.map((p) => p[1]);
      const [x0, x1, z0, z1] = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)];
      for (let z = Math.floor(z0 / step) * step + step / 2; z < z1; z += step) {
        for (let x = Math.floor(x0 / step) * step + step / 2; x < x1; x += step) {
          if (x < 0 || z < 0 || x >= grid.sizeM || z >= grid.sizeM || !inRing(ring, x, z)) continue;
          const id = Math.floor(z / grid.cellM) * cells + Math.floor(x / grid.cellM);
          const cell = acc.get(id) ?? { hits: 0, topSum: 0 };
          cell.hits++;
          cell.topSum += part.topYM;
          acc.set(id, cell);
        }
      }
    }
  }
  return acc;
};

/** One box per built cell, centred in the cell, sunk 1 m into the coarse ground so it never floats. */
export const blockImpostors = (parts: readonly FramedPart[], grid: BlockGrid, groundAt: (x: number, z: number) => number): TileBuildingPart[] => {
  const cells = Math.round(grid.sizeM / grid.cellM);
  const samples = SAMPLES_PER_CELL_SIDE * SAMPLES_PER_CELL_SIDE;
  const blocks: TileBuildingPart[] = [];
  for (const [id, cell] of [...sampleCells(parts, grid)].sort(([a], [b]) => a - b)) {
    const share = Math.min(1, cell.hits / samples);
    if (share < MIN_BUILT_SHARE) continue;
    const cx = ((id % cells) + 0.5) * grid.cellM;
    const cz = (Math.floor(id / cells) + 0.5) * grid.cellM;
    const half = (grid.cellM * Math.sqrt(share)) / 2;
    const baseYM = Math.round((groundAt(cx, cz) - 1) * 100) / 100;
    const topYM = cell.topSum / cell.hits;
    if (topYM <= baseYM + 1) continue;
    const ring: LocalPoint[] = [
      [cx - half, cz - half],
      [cx + half, cz - half],
      [cx + half, cz + half],
      [cx - half, cz + half],
      [cx - half, cz - half],
    ];
    blocks.push({ id: `block:${id}`, baseYM, heightM: Math.round((topYM - baseYM) * 100) / 100, polygons: [[ring]] });
  }
  return blocks;
};
