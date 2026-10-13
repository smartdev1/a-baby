/**
 * Role: bilinear ground height at any UTM point from the per-tile terrain grids (0 where no tile exists); used to seat buildings and drape roads.
 * Owner: backend
 */

import { formatTileKey, tileBounds, tileCoordOf } from '@skyline/geo';
import type { TileTerrain } from './tile-terrain.ts';

export class TerrainSampler {
  constructor(private readonly tiles: ReadonlyMap<string, TileTerrain>) {}

  heightAt(e: number, n: number): number {
    const key = formatTileKey(tileCoordOf({ eastingM: e, northingM: n }, 0));
    const t = this.tiles.get(key);
    if (!t) return 0;
    const b = tileBounds(key);
    const fx = Math.min((e - b.minEastingM) / t.cellSizeM, t.resolution - 1.000001);
    const fz = Math.min((n - b.minNorthingM) / t.cellSizeM, t.resolution - 1.000001);
    const i = Math.floor(fx);
    const j = Math.floor(fz);
    const tx = fx - i;
    const tz = fz - j;
    const h = (ii: number, jj: number): number => t.heightsM[jj * t.resolution + ii] ?? 0;
    return (h(i, j) * (1 - tx) + h(i + 1, j) * tx) * (1 - tz) + (h(i, j + 1) * (1 - tx) + h(i + 1, j + 1) * tx) * tz;
  }
}
