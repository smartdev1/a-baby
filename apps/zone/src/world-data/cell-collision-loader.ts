/**
 * Role: loads the collision tiles of a cell (+ one ring of neighbour tiles) from a pipeline release into a CollisionWorld whose frame origin is the cell south-west corner.
 * Owner: backend
 */

import { existsSync, readdirSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  CELL_SIZE_IN_TILES,
  cellBounds,
  formatTileKey,
  parseCellKey,
  tileBounds,
  type TileKey,
  type UtmPosition,
} from '@skyline/geo';
import { CollisionWorld } from '@skyline/physics';
import { decodeCollision, parseWorldManifest, tileFilePath } from '@skyline/tile-format';

export interface CellWorld {
  readonly world: CollisionWorld;
  readonly frameOrigin: UtmPosition;
  readonly tilesLoaded: number;
}

/** `releaseDir` = folder with `16-encode/tiles` and `17-manifest/world-manifest.*.json`; missing release ⇒ flat empty world. */
export const loadCellCollision = async (releaseDir: string, cellKey: string): Promise<CellWorld> => {
  const bounds = cellBounds(cellKey);
  const frameOrigin = { eastingM: bounds.minEastingM, northingM: bounds.minNorthingM };
  const world = new CollisionWorld();
  const manifestDir = join(releaseDir, '17-manifest');
  const manifestFile = existsSync(manifestDir)
    ? readdirSync(manifestDir).find((f) => f.startsWith('world-manifest.'))
    : undefined;
  if (!manifestFile) return { world, frameOrigin, tilesLoaded: 0 };

  const manifest = parseWorldManifest(JSON.parse(await readFile(join(manifestDir, manifestFile), 'utf8')));
  const { i, j } = parseCellKey(cellKey);
  let tilesLoaded = 0;
  for (let tj = j * CELL_SIZE_IN_TILES - 1; tj <= (j + 1) * CELL_SIZE_IN_TILES; tj++) {
    for (let ti = i * CELL_SIZE_IN_TILES - 1; ti <= (i + 1) * CELL_SIZE_IN_TILES; ti++) {
      const key: TileKey = formatTileKey({ level: 0, i: ti, j: tj });
      const hash = manifest.tiles[key]?.collision;
      if (!hash) continue;
      const bytes = await readFile(join(releaseDir, '16-encode', tileFilePath(key, 'collision', hash)));
      const tb = tileBounds(key);
      world.addTile(
        decodeCollision(new Uint8Array(bytes)),
        tb.minEastingM - frameOrigin.eastingM,
        tb.minNorthingM - frameOrigin.northingM,
      );
      tilesLoaded++;
    }
  }
  return { world, frameOrigin, tilesLoaded };
};
