/**
 * Role: reads the Float32 ENVI raster written by gdalwarp (UTM 30N, 5 m, north-up) into a HeightGrid with row 0 = south; no-data becomes 0.
 * Owner: backend
 */

import { readFile } from 'node:fs/promises';
import { HeightGrid } from './height-grid.ts';

export interface RasterExtent {
  readonly minE: number;
  readonly minN: number;
  readonly maxE: number;
  readonly maxN: number;
  readonly cellM: number;
}

export const NODATA = -9999;

export const readEnviFloat32 = async (binPath: string, extent: RasterExtent): Promise<HeightGrid> => {
  const header = await readFile(binPath.replace(/\.bin$/, '.hdr'), 'utf8');
  const field = (name: string): number => Number(new RegExp(`${name}\\s*=\\s*(\\d+)`).exec(header)?.[1] ?? NaN);
  const cols = field('samples');
  const rows = field('lines');
  if (field('data type') !== 4 || field('byte order') !== 0) throw new Error('expected little-endian Float32 ENVI raster');
  const bytes = await readFile(binPath);
  const north = new Float32Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + cols * rows * 4));
  const values = new Float32Array(cols * rows);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const v = north[(rows - 1 - r) * cols + c] ?? NODATA;
      values[r * cols + c] = v <= NODATA + 1 ? 0 : v;
    }
  }
  return new HeightGrid({ minE: extent.minE, minN: extent.minN, cellM: extent.cellM, cols, rows }, values);
};
