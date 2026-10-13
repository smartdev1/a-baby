/**
 * Role: turns the Copernicus surface model (DSM: includes roofs and tree tops) into a plausible ground: separable minimum filter, then mean filter.
 * Owner: backend
 */

import { HeightGrid } from './height-grid.ts';

type Reduce = (window: number[]) => number;

const separable = (grid: HeightGrid, radius: number, reduce: Reduce): HeightGrid => {
  const pass = (src: Float32Array, horizontal: boolean): Float32Array => {
    const out = new Float32Array(src.length);
    const window: number[] = [];
    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        window.length = 0;
        for (let k = -radius; k <= radius; k++) {
          const cc = horizontal ? Math.min(grid.cols - 1, Math.max(0, c + k)) : c;
          const rr = horizontal ? r : Math.min(grid.rows - 1, Math.max(0, r + k));
          window.push(src[rr * grid.cols + cc] ?? 0);
        }
        out[r * grid.cols + c] = reduce(window);
      }
    }
    return out;
  };
  return new HeightGrid(grid, pass(pass(grid.values, true), false));
};

const min: Reduce = (w) => Math.min(...w);
const mean: Reduce = (w) => w.reduce((a, b) => a + b, 0) / w.length;

/** Removes features narrower than ~2×minRadius cells (buildings, trees), then smooths. */
export const groundFromSurface = (dsm: HeightGrid, minRadiusCells = 4, smoothRadiusCells = 3): HeightGrid =>
  separable(separable(dsm, minRadiusCells, min), smoothRadiusCells, mean);
