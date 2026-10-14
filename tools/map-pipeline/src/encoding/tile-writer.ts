/**
 * Role: writes encoded tiles to the release folder (tiles/L{n}/{i}_{j}/<kind>.<hash>.<ext>) and summarises them for the stage indexes; runs inside the encoding workers.
 * Owner: backend
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { TileKey } from '@skyline/geo';
import { tileFilePath } from '@skyline/tile-format';
import { budgetViolations, tileBytes } from './tile-budgets.ts';
import type { EncodedFile, EncodedLodTile, EncodedTile } from './tile-encoder.ts';

/** What the index needs from an L0 tile once its files are written. */
export interface L0TileSummary {
  readonly kind: 'l0';
  readonly key: string;
  readonly geom: string;
  readonly collision: string;
  readonly meta: string;
  readonly instances?: string;
  readonly bytes: number;
  readonly triangles: number;
  readonly drawCalls: number;
  readonly violations: readonly string[];
}

export interface LodTileSummary {
  readonly kind: 'lod';
  /** Render-only level (1, 2 or 3), read from the key. */
  readonly level: number;
  readonly key: string;
  readonly geom: string;
  readonly bytes: number;
  readonly triangles: number;
}

const writeOne = async (outDir: string, key: string, kind: 'geom' | 'collision' | 'meta' | 'instances', file: EncodedFile): Promise<void> => {
  const path = join(outDir, tileFilePath(key as TileKey, kind, file.hash));
  await mkdir(join(path, '..'), { recursive: true });
  await writeFile(path, file.bytes);
};

export const writeL0Tile = async (outDir: string, t: EncodedTile): Promise<L0TileSummary> => {
  await writeOne(outDir, t.key, 'geom', t.geom);
  await writeOne(outDir, t.key, 'collision', t.collision);
  await writeOne(outDir, t.key, 'meta', t.meta);
  if (t.instances) await writeOne(outDir, t.key, 'instances', t.instances);
  return {
    kind: 'l0',
    key: t.key,
    geom: t.geom.hash,
    collision: t.collision.hash,
    meta: t.meta.hash,
    ...(t.instances ? { instances: t.instances.hash } : {}),
    bytes: tileBytes(t),
    triangles: t.triangles,
    drawCalls: t.drawCalls,
    violations: budgetViolations(t),
  };
};

export const writeLodTile = async (outDir: string, t: EncodedLodTile): Promise<LodTileSummary> => {
  await writeOne(outDir, t.key, 'geom', t.geom);
  return { kind: 'lod', level: Number(t.key.slice(1, t.key.indexOf('_'))), key: t.key, geom: t.geom.hash, bytes: t.geom.bytes.length, triangles: t.triangles };
};
