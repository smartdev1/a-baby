/**
 * Role: the per-tile encoding jobs (L0 tile files, L1 render tile): parse the tile line, encode, write the files and return their summary; shared by the worker entry and the inline path, so both run exactly the same code.
 * Owner: backend
 */

import { encodeLodTile, encodeTile, type EncodeOptions } from '../encoding/tile-encoder.ts';
import { type L0TileSummary, type LodTileSummary, writeL0Tile, writeLodTile } from '../encoding/tile-writer.ts';
import { buildCoarseTile } from '../lod/build-coarse-tile.ts';
import { buildL1Tile } from '../lod/build-l1-tile.ts';
import type { TileContent } from '../tiling/tile-content.ts';

/** Tiles travel as their tiles.ndjson line: the worker parses them, the main thread only reads lines. */
export type EncodeJob =
  | { readonly kind: 'l0'; readonly tileJson: string }
  | { readonly kind: 'l1'; readonly key: string; readonly children: readonly (readonly [string, string])[] }
  | { readonly kind: 'coarse'; readonly level: 2 | 3; readonly key: string; readonly children: readonly (readonly [string, string])[] };

/** Same for every job of a stage: sent once to each worker. */
export interface EncodeContext {
  /** Keys of every L0 tile (neighbour lists in meta.json). */
  readonly existing: readonly string[];
  readonly options: EncodeOptions;
  /** Stage output folder the tile files are written into. */
  readonly outDir: string;
}

export type EncodeJobResult = L0TileSummary | LodTileSummary;

export const runEncodeJob = async (job: EncodeJob, context: { readonly existing: ReadonlySet<string>; readonly options: EncodeOptions; readonly outDir: string }): Promise<EncodeJobResult> => {
  if (job.kind === 'l0') return writeL0Tile(context.outDir, await encodeTile(JSON.parse(job.tileJson) as TileContent, context.existing, context.options));
  const children = new Map(job.children.map(([key, json]) => [key, JSON.parse(json) as TileContent]));
  const tile = job.kind === 'l1' ? buildL1Tile(job.key, children) : buildCoarseTile(job.key, job.level, children);
  return writeLodTile(context.outDir, await encodeLodTile(tile));
};
