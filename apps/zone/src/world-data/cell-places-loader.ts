/**
 * Role: loads the typed places of a cell and their action sites from the tile meta.json files of a pipeline release, in the cell frame (metres from the cell south-west corner).
 * Owner: backend
 */

import { existsSync, readdirSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { cellBounds, tileBounds, tilesOfCell } from '@skyline/geo';
import { parseTileMeta, parseWorldManifest, tileFilePath } from '@skyline/tile-format';

export interface CellSite {
  readonly kind: string;
  readonly capacity: number;
  readonly x: number;
  readonly z: number;
  readonly yawRad: number;
}

export interface CellPlace {
  readonly id: string;
  readonly placeType: string;
  readonly displayName: string | null;
  readonly sites: readonly CellSite[];
}

export const loadCellPlaces = async (releaseDir: string, cellKey: string): Promise<Map<string, CellPlace>> => {
  const places = new Map<string, CellPlace>();
  const manifestDir = join(releaseDir, '17-manifest');
  const manifestFile = existsSync(manifestDir) ? readdirSync(manifestDir).find((f) => f.startsWith('world-manifest.')) : undefined;
  if (!manifestFile) return places;
  const manifest = parseWorldManifest(JSON.parse(await readFile(join(manifestDir, manifestFile), 'utf8')));
  const cell = cellBounds(cellKey);
  for (const key of tilesOfCell(cellKey)) {
    const hash = manifest.tiles[key]?.meta;
    if (!hash) continue;
    const meta = parseTileMeta(JSON.parse(await readFile(join(releaseDir, '16-encode', tileFilePath(key, 'meta', hash)), 'utf8')));
    const tb = tileBounds(key);
    const [ox, oz] = [tb.minEastingM - cell.minEastingM, tb.minNorthingM - cell.minNorthingM];
    for (const p of meta.places) {
      if (!p.placeType || !p.sites) continue;
      places.set(p.id, {
        id: p.id,
        placeType: p.placeType,
        displayName: p.displayName,
        sites: p.sites.map((s) => ({ kind: s.kind, capacity: s.capacity, x: ox + s.position.x, z: oz + s.position.z, yawRad: s.yawRad })),
      });
    }
  }
  return places;
};
