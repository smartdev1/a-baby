/**
 * Role: naming conventions of tile files (`tiles/L0/{i}_{j}/<kind>.{hash}.<ext>`), exposed as functions so no path string is ever copied by hand.
 * Owner: backend
 */

import { parseTileKey, type TileKey } from '@skyline/geo';

export const TILE_FILE_KINDS = ['geom', 'instances', 'collision', 'meta', 'nav'] as const;
export type TileFileKind = (typeof TILE_FILE_KINDS)[number];

const EXTENSION: Record<TileFileKind, string> = {
  geom: 'glb',
  instances: 'bin',
  collision: 'bin',
  meta: 'json',
  nav: 'bin',
};

/** Content hash in file names: first 16 hex characters of the sha256 of the file. */
export const CONTENT_HASH_PATTERN = /^[0-9a-f]{16}$/;

const assertHash = (hash: string): void => {
  if (!CONTENT_HASH_PATTERN.test(hash))
    throw new SyntaxError(`invalid content hash "${hash}" (16 lowercase hex chars expected)`);
};

/** Folder of a tile: `tiles/L0/325_199`. */
export const tileDirectory = (key: TileKey): string => {
  const { level, i, j } = parseTileKey(key);
  return `tiles/L${level}/${i}_${j}`;
};

/** File name inside the tile folder: `collision.3fa1c09b2d4e5f60.bin`. */
export const tileFileName = (kind: TileFileKind, hash: string): string => {
  assertHash(hash);
  return `${kind}.${hash}.${EXTENSION[kind]}`;
};

/** Repository/CDN-relative path of a tile file. */
export const tileFilePath = (key: TileKey, kind: TileFileKind, hash: string): string =>
  `${tileDirectory(key)}/${tileFileName(kind, hash)}`;

const FILE_NAME_PATTERN = /^(geom|instances|collision|meta|nav)\.([0-9a-f]{16})\.(glb|bin|json)$/;

export const parseTileFileName = (name: string): { kind: TileFileKind; hash: string } => {
  const match = FILE_NAME_PATTERN.exec(name);
  const kind = match?.[1] as TileFileKind | undefined;
  if (!match || !kind || EXTENSION[kind] !== match[3]) throw new SyntaxError(`invalid tile file name "${name}"`);
  return { kind, hash: match[2] ?? '' };
};

/** Manifest file of a release: `world-manifest.yopougon-2026-10-01.json`. */
export const worldManifestFileName = (release: string): string => {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(release)) throw new SyntaxError(`invalid release name "${release}"`);
  return `world-manifest.${release}.json`;
};
