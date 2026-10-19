/**
 * Role: Tile loader setup helper — creates and initializes the TileLoader instance.
 * Owner: frontend
 */
import { TileLoader } from '../../streaming/tile-loader.ts';
import type { WorldRenderer } from '../../streaming/types.ts';

/** Minimal WorldRenderer implementation for step 1 - logs tile integration */
const minimalWorldRenderer: WorldRenderer = {
  integrateTile(tileKey: string, level: number, data: { glbScene: unknown; instances: unknown; collision: unknown; meta: unknown }) {
    console.log(`[TILE LOADER] Integrating tile ${tileKey} at LOD ${level}`, {
      hasGLB: !!data.glbScene,
      hasInstances: !!data.instances,
      hasCollision: !!data.collision,
      metaKeys: typeof data.meta === 'object' && data.meta !== null ? Object.keys(data.meta) : []
    });
  }
};

export async function createTileLoader(): Promise<TileLoader> {
  const tileLoader = new TileLoader({
    baseUrl: '/tiles/L0/',
    worldRenderer: minimalWorldRenderer,
    maxWorkers: navigator.hardwareConcurrency || 4,
    frameBudgetMs: 4,
    schedulerOptions: { radius: 2, throttleMs: 250 }
  });
  await tileLoader.initialize();
  return tileLoader;
}
