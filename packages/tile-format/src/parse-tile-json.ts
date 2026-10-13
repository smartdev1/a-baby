/**
 * Role: validates untrusted tile JSON (meta, manifest) and turns Zod issues into one readable error with the failing paths.
 * Owner: backend
 */

import { z } from 'zod';
import { type TileMeta, TileMetaSchema } from './tile-meta-schema.ts';
import { type WorldManifest, WorldManifestSchema } from './world-manifest-schema.ts';

export class TileFormatError extends Error {
  override readonly name = 'TileFormatError';
}

const parseWith = <T>(schema: z.ZodType<T>, value: unknown, label: string): T => {
  const result = schema.safeParse(value);
  if (!result.success) throw new TileFormatError(`invalid ${label}:\n${z.prettifyError(result.error)}`);
  return result.data;
};

export const parseTileMeta = (value: unknown): TileMeta => parseWith(TileMetaSchema, value, 'tile meta');
export const parseWorldManifest = (value: unknown): WorldManifest =>
  parseWith(WorldManifestSchema, value, 'world manifest');
