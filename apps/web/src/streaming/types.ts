/**
 * Role: types — Type definitions for tile streaming.
 * Owner: frontend
 *
 * Exports the WorldRenderer interface that tile-loader uses to integrate tiles,
 * and re-exports TileKey from tile-format.
 */

import type { TileKey } from '@skyline/tile-format';
import type { TileMeta } from '@skyline/tile-format';

/**
 * Interface for world renderer integration.
 * Implementations receive tile data and integrate it into the 3D world.
 */
export interface WorldRenderer {
  /**
   * Integrates a loaded tile into the world.
   * @param tileKey The tile key (e.g., "L0_296_178")
   * @param level LOD level (0=highest, 1,2,3=lower detail)
   * @param data Object containing the tile's data
   * @param data.glbScene Parsed GLB scene (three.js object or similar)
   * @param data.instances Instance data for placing objects
   * @param data.collision Collision data for physics
   * @param data.meta Tile metadata (buildings, places, etc.)
   */
  integrateTile(
    tileKey: TileKey,
    level: 0 | 1 | 2 | 3,
    data: {
      glbScene: unknown;
      instances: unknown;
      collision: unknown;
      meta: TileMeta;
    }
  ): void;
}