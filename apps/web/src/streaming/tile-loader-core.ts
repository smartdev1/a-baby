/**
 * Role: tile-loader-core — Core tile loading logic that orchestrates scheduler, cache, worker pool, and queue.
 * Owner: frontend
 *
 * Main class that coordinates tile loading: uses scheduler to determine needed tiles, cache to avoid
 * redundant loads, worker pool to fetch data in background, and integrates tiles
 * via a WorldRenderer interface while respecting frame budget.
 */

import type { TileKey } from '@skyline/tile-format';
import { TileScheduler } from './tile-scheduler';
import { TileCache } from './tile-cache';
import type { WorldRenderer } from './types';
import { WorkerPool } from './worker-pool';
import { TileQueue } from './tile-queue';

interface TileLoaderOptions {
  /** Base URL for tile data (e.g., '/tiles/L0/') */
  baseUrl: string;
  /** World renderer implementation */
  worldRenderer: WorldRenderer;
  /** Maximum number of workers (default: navigator.hardwareConcurrency || 4) */
  maxWorkers?: number;
  /** Frame budget for integration in ms (default: 4ms) */
  frameBudgetMs?: number;
  /** Tile scheduler options */
  schedulerOptions?: {
    radius?: number;
    throttleMs?: number;
  };
  /** Tile cache options */
  cacheOptions?: {
    sizeLimitMb?: number;
    cacheName?: string;
  };
}

export class TileLoader {
  readonly maxWorkers: number;
  private readonly frameBudgetMs: number;
  private readonly scheduler: TileScheduler;
  readonly cache: TileCache;
  readonly workerPool: WorkerPool;
  private readonly tileQueue: TileQueue;

  private isInitialized = false;

  constructor(options: TileLoaderOptions) {
    this.maxWorkers = options.maxWorkers ?? Math.max(navigator.hardwareConcurrency || 4, 2);
    this.frameBudgetMs = options.frameBudgetMs ?? 4;
    this.scheduler = new TileScheduler(options.schedulerOptions);
    this.cache = new TileCache(options.cacheOptions);
    this.workerPool = new WorkerPool(
      options.baseUrl,
      this.cache,
      options.worldRenderer,
      this.maxWorkers,
      this.frameBudgetMs
    );
    this.tileQueue = new TileQueue(
      this.scheduler
    );
  }

  /**
   * Initializes the tile loader (cache and workers).
   * Must be called before use.
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    await this.cache.initialize();
    await this.workerPool.initialize();
    await this.tileQueue.initialize();
    this.isInitialized = true;
  }

  /**
   * Updates camera state and triggers tile loading as needed.
   * @param cameraState Current camera state (position, heading, speed)
   */
  updateCameraState(cameraState: {
    position: { x: number; z: number };
    heading: number;
    speed: number
  }): void {
    if (!this.isInitialized) {
      return;
    }

    // Get desired tiles from scheduler (handles throttling internally)
    const desiredTiles = this.scheduler.updateCameraState(cameraState);

    // Mark each tile as loading in cache
    for (const tileKey of desiredTiles) {
      void this.cache.markLoading(tileKey);
    }

    // Update the tile queue with camera state
    this.tileQueue.updateCameraState(
      cameraState,
      (tileKey) => this.assignWorkerToTile(tileKey),
      () => this.processQueue()
    );
  }

  /**
   * Assigns a free worker to a tile.
   * @returns true if worker was assigned, false if no free workers
   * @private
   */
  private assignWorkerToTile(tileKey: TileKey): boolean {
    return this.workerPool.assignWorkerToTile(tileKey);
  }

  /**
   * Processes the task queue when workers become free.
   * @private
   */
  private processQueue(): void {
    this.workerPool.processQueue();
  }

  /**
   * Clean up resources.
   */
  destroy(): void {
    this.workerPool.destroy();
    this.tileQueue.destroy();
  }
}
