/**
 * Role: meshes the tile terrain: ground grid from the 51 × 51 heights (normals from neighbours) and flat water quads over water cells (row runs merged).
 * Owner: backend
 */

import type { TileTerrain } from '../terrain/tile-terrain.ts';
import type { MeshBuffer } from './mesh-buffer.ts';

const height = (t: TileTerrain, i: number, j: number): number => {
  const ii = Math.max(0, Math.min(t.resolution - 1, i));
  const jj = Math.max(0, Math.min(t.resolution - 1, j));
  return t.heightsM[jj * t.resolution + ii] ?? 0;
};

export const addTerrainGrid = (buffer: MeshBuffer, t: TileTerrain): void => {
  const base = buffer.vertexCount;
  const step = t.cellSizeM;
  for (let j = 0; j < t.resolution; j++) {
    for (let i = 0; i < t.resolution; i++) {
      const nx = height(t, i - 1, j) - height(t, i + 1, j);
      const nz = height(t, i, j - 1) - height(t, i, j + 1);
      const ny = 2 * step;
      const len = Math.hypot(nx, ny, nz);
      buffer.vertex([i * step, height(t, i, j), j * step], [nx / len, ny / len, nz / len]);
    }
  }
  for (let j = 0; j < t.resolution - 1; j++) {
    for (let i = 0; i < t.resolution - 1; i++) {
      const a = base + j * t.resolution + i;
      buffer.triangle(a, a + 1, a + t.resolution + 1);
      buffer.triangle(a, a + t.resolution + 1, a + t.resolution);
    }
  }
};

export const isWaterCell = (mask: Uint8Array, cellsPerSide: number, i: number, j: number): boolean => {
  const k = j * cellsPerSide + i;
  return ((mask[k >> 3] ?? 0) & (1 << (k & 7))) !== 0;
};

/** Water surface: one quad per horizontal run of water cells. */
export const addWaterCells = (buffer: MeshBuffer, t: TileTerrain): void => {
  if (!t.water) return;
  const mask = new Uint8Array(Buffer.from(t.water.maskBase64, 'base64'));
  const { cellsPerSide, levelM } = t.water;
  const step = t.cellSizeM;
  for (let j = 0; j < cellsPerSide; j++) {
    let i = 0;
    while (i < cellsPerSide) {
      if (!isWaterCell(mask, cellsPerSide, i, j)) {
        i++;
        continue;
      }
      const start = i;
      while (i < cellsPerSide && isWaterCell(mask, cellsPerSide, i, j)) i++;
      const v = [
        buffer.vertex([start * step, levelM, j * step], [0, 1, 0]),
        buffer.vertex([i * step, levelM, j * step], [0, 1, 0]),
        buffer.vertex([i * step, levelM, (j + 1) * step], [0, 1, 0]),
        buffer.vertex([start * step, levelM, (j + 1) * step], [0, 1, 0]),
      ] as const;
      buffer.triangle(v[0], v[1], v[2]);
      buffer.triangle(v[0], v[2], v[3]);
    }
  }
};
