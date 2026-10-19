/**
 * Role: worker-pool — Manages a pool of Web Workers for parallel tile loading.
 * Owner: frontend
 *
 * Creates and manages a pool of workers that execute tile-loading tasks in parallel.
 * Handles worker lifecycle, message passing, and error handling.
 */

import type { TileCache, TileLoadStatus } from './tile-cache';
import type { WorldRenderer } from './types';
import type { TileKey, TileMeta } from '@skyline/tile-format';

/** Message types for communication with workers */

interface TileManifest {
  formatVersion: number;
  tileKey: string;
  buildings: Array<{
    id: string;
    type: string;
    levels: number;
    heightM: number;
    heightSource: string;
  }>;
  places: Array<{
    id: string;
    category: string;
    displayName: string | null;
    position: { x: number; z: number };
    buildingId: string | null;
  }>;
  neighbours: string[];
}

interface TileWorkerResponse {
  type: 'tileData';
  tileKey: TileKey;
  manifest: TileManifest;
  glbScene: ArrayBuffer | null;
  instances: ArrayBuffer | null;
  collision: ArrayBuffer | null;
}

interface TileWorkerError {
  type: 'error';
  tileKey: TileKey;
  message: string;
}

type TileWorkerMessage = TileWorkerResponse | TileWorkerError;

/** Internal state for tracking tile loading */
interface TileLoadState {
  status: TileLoadStatus;
  worker: Worker | null;
  abortController: AbortController | null;
  retries: number;
}

export class WorkerPool {
  private readonly baseUrl: string;
  private readonly cache: TileCache;
  private readonly worldRenderer: WorldRenderer;
  private readonly maxWorkers: number;
  private readonly frameBudgetMs: number;

  private readonly workers: Worker[] = [];
  private readonly freeWorkers: Worker[] = [];
  private readonly activeLoads: Map<TileKey, TileLoadState> = new Map();
  private readonly taskQueue: TileKey[] = [];

  private isInitialized = false;

  constructor(
    baseUrl: string,
    cache: TileCache,
    worldRenderer: WorldRenderer,
    maxWorkers: number,
    frameBudgetMs: number = 4
  ) {
    this.baseUrl = baseUrl;
    this.cache = cache;
    this.worldRenderer = worldRenderer;
    this.maxWorkers = maxWorkers;
    this.frameBudgetMs = frameBudgetMs;
  }

  /**
   * Initializes the worker pool.
   * Must be called before use.
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    await this.createWorkers();
    this.isInitialized = true;
  }

  /**
   * Creates the pool of workers.
   * @private
   */
  private async createWorkers(): Promise<void> {
    // Use the actual worker file instead of inline code
    // Vite will bundle it correctly with proper imports
    const workerUrl = new URL('./tile-worker.ts', import.meta.url);

    for (let i = 0; i < this.maxWorkers; i++) {
      const worker = new Worker(workerUrl, { type: 'module' });
      worker.onmessage = this.handleWorkerMessage.bind(this);
      worker.onerror = (ev) => {
        const tileKey = this.findTileKeyForWorker(worker);
        if (tileKey) {
          this.handleWorkerError(tileKey, new Error(ev.message));
        } else {
          console.error('Worker error (no active tile):', ev.message);
        }
      };
      this.workers.push(worker);
      this.freeWorkers.push(worker);
    }

    await Promise.resolve();
  }

  /**
   * Handles messages from workers.
   * @private
   */
  private handleWorkerMessage(event: MessageEvent): void {
    const data = event.data as TileWorkerMessage;
    if (data.type === 'tileData') {
      void this.handleTileData(data);
    } else if (data.type === 'error') {
      this.handleWorkerError(data.tileKey, new Error(data.message));
    }
  }

  /**
   * Handles errors from workers.
   * @private
   */
  private handleWorkerError(tileKey: string, error: Error): void {
    if (!tileKey) {
      console.error('Worker error with no tile key:', error);
      return;
    }
    console.error(`Worker error for tile ${tileKey}:`, error);
    void this.completeTileLoad(tileKey as TileKey, `Worker error: ${error.message}`);
  }

  /**
   * Finds the tile key currently assigned to a worker, if any.
   * @private
   */
  private findTileKeyForWorker(worker: Worker): TileKey | null {
    for (const [tileKey, state] of this.activeLoads) {
      if (state.worker === worker) {
        return tileKey;
      }
    }
    return null;
  }

  /**
   * Processes successful tile data from a worker.
   * @private
   */
  private async handleTileData(data: {
    tileKey: TileKey;
    manifest: TileManifest;
    glbScene: ArrayBuffer | null;
    instances: ArrayBuffer | null;
    collision: ArrayBuffer | null;
  }): Promise<void> {
    const { tileKey, manifest, glbScene, instances, collision } = data;

    try {
      // Mark as loaded in cache
      await this.cache.markLoaded(tileKey, {
        manifest,
        glbScene,
        instances,
        collision
      });

      // Integrate into world
      await this.scheduleIntegration(tileKey, {
        glbScene,
        instances,
        collision,
        meta: manifest as TileMeta
      });
    } catch (error) {
      console.error(`Error integrating tile ${tileKey}:`, error);
      const message = error instanceof Error ? error.message : String(error);
      await this.completeTileLoad(tileKey, `Integration error: ${message}`);
    } finally {
      this.cleanupWorkerForTile(tileKey);
    }
  }

  /**
   * Completes loading of a tile (success or failure).
   * @private
   */
  private async completeTileLoad(tileKey: TileKey, errorMessage?: string): Promise<void> {
    if (errorMessage) {
      await this.cache.markFailed(tileKey, errorMessage);
    }
    this.cleanupWorkerForTile(tileKey);
  }

  /**
   * Cleans up worker associated with a tile and makes it available for reuse.
   * @private
   */
  private cleanupWorkerForTile(tileKey: TileKey): void {
    const state = this.activeLoads.get(tileKey);
    if (state) {
      // Return the worker to the free pool for reuse instead of terminating it.
      if (state.worker) {
        if (!this.freeWorkers.includes(state.worker)) {
          this.freeWorkers.push(state.worker);
        }
      }
      this.activeLoads.delete(tileKey);
    }

    // Try to process next queued task
    this.processQueue();
  }

  /**

  /**
   * Schedules tile integration to respect frame budget.
   * @private
   */
  private async scheduleIntegration(tileKey: TileKey, data: {
    glbScene: ArrayBuffer | null;
    instances: ArrayBuffer | null;
    collision: ArrayBuffer | null;
    meta: TileMeta;
  }): Promise<void> {
    // Yield to the browser first so the current frame can paint.
    // setTimeout(0) is used instead of requestAnimationFrame because:
    // - rAF fires before paint, which could block the compositor
    // - setTimeout(0) defers to the next macrotask, allowing paint + layout
    // - This ensures the 4ms budget is measured against actual frame time
    await new Promise(resolve => setTimeout(resolve, 0));

    const buildings = Array.isArray(data.meta.buildings) ? data.meta.buildings : [];
    // ~0.05 ms per building => fit `frameBudgetMs` worth of work per frame.
    const msPerBuilding = 0.05;
    const perFrame = Math.max(1, Math.floor(this.frameBudgetMs / msPerBuilding));
    const level: 0 | 1 | 2 | 3 = 0;

    if (buildings.length === 0) {
      this.worldRenderer.integrateTile(tileKey, level, data);
      return;
    }

    // Split the tile's buildings across multiple frames to stay within budget.
    for (let offset = 0; offset < buildings.length; offset += perFrame) {
      const chunkBuildings = buildings.slice(offset, offset + perFrame);
      const chunkData = {
        glbScene: offset === 0 ? data.glbScene : null,
        instances: offset === 0 ? data.instances : null,
        collision: offset === 0 ? data.collision : null,
        meta: { ...data.meta, buildings: chunkBuildings },
      };
      try {
        this.worldRenderer.integrateTile(tileKey, level, chunkData);
      } catch (error) {
        console.error(`Error in world renderer for tile ${tileKey}:`, error);
      }
      // Yield to the browser between chunks.
      if (offset + perFrame < buildings.length) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
  }

  /**
   * Assigns a free worker to a tile.
   * @returns true if worker was assigned, false if no free workers
   */
  assignWorkerToTile(tileKey: TileKey): boolean {
    if (this.freeWorkers.length === 0) {
      return false;
    }

    const worker = this.freeWorkers.pop()!;
    const state = this.activeLoads.get(tileKey);
    if (!state) {
      // Tile was cancelled or completed while we were finding a worker
      this.freeWorkers.push(worker);
      return false;
    }

    state.worker = worker;
    worker.postMessage({
      type: 'loadTile',
      tileKey,
      baseUrl: this.baseUrl
    });

    return true;
  }

  /**
   * Processes the task queue when workers become free.
   */
  processQueue(): void {
    while (this.freeWorkers.length > 0 && this.taskQueue.length > 0) {
      const tileKey = this.taskQueue.shift()!;
      if (this.activeLoads.has(tileKey)) {
        // Still needs loading
        this.assignWorkerToTile(tileKey);
      }
      // If not in activeLoads, it was cancelled or completed
    }
  }

  /**
   * Clean up resources.
   */
  destroy(): void {
    // Terminate all workers
    for (const worker of this.workers) {
      worker.terminate();
    }
    this.workers.length = 0;
    this.freeWorkers.length = 0;
  }
}
