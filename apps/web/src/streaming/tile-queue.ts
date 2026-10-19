/**
 * Role: tile-queue — Manages the queue of tiles to be loaded based on camera state.
 * Owner: frontend
 *
 * Handles scheduling tile loads based on camera position, respects throttling,
 * and manages the loading queue.
 */

import type { TileScheduler } from './tile-scheduler';
import type { TileKey } from '@skyline/tile-format';

interface CameraState {
  position: { x: number; z: number };
  heading: number; // radians, 0 = +X, PI/2 = -Z
  speed: number; // m/s
}

/** Internal state for tracking tile loading */
interface TileLoadState {
  status: 'idle' | 'loading' | 'loaded' | 'failed';
  worker: Worker | null;
  abortController: AbortController | null;
  retries: number;
}

export class TileQueue {
  private readonly scheduler: TileScheduler;

  private readonly activeLoads: Map<TileKey, TileLoadState> = new Map();
  private readonly taskQueue: TileKey[] = [];
  private readonly freeWorkers: Worker[] = [];

  private isInitialized = false;

  constructor(
    scheduler: TileScheduler
  ) {
    this.scheduler = scheduler;
  }

  /**
   * Initializes the tile queue.
   * Must be called before use.
   */
  async initialize(): Promise<void> {
    // Initialization handled by constructor
    await Promise.resolve();
    this.isInitialized = true;
  }

  /**
   * Updates camera state and triggers tile loading as needed.
   * @param cameraState Current camera state (position, heading, speed)
   */
  updateCameraState(
    cameraState: CameraState,
    assignWorkerToTile: (tileKey: TileKey) => boolean,
    processQueue: () => void
  ): void {
    if (!this.isInitialized) {
      return;
    }

    // Get desired tiles from scheduler
    const desiredTiles = this.scheduler.updateCameraState(cameraState);

    // Process each tile
    for (const tileKey of desiredTiles) {
      this.scheduleTileLoad(tileKey, assignWorkerToTile, processQueue);
    }
  }

  /**
   * Schedules a tile for loading if needed.
   * @private
   */
  private scheduleTileLoad(
    tileKey: TileKey,
    assignWorkerToTile: (tileKey: TileKey) => boolean,
    processQueue: () => void
  ): void {
    // This would normally check cache status, but we're delegating that to TileLoaderCore
    // For now, just attempt to assign a worker or queue the task
    if (!assignWorkerToTile(tileKey)) {
      this.taskQueue.push(tileKey);
    }
    processQueue();
  }

  /**
   * Assigns a free worker to a tile.
   * @returns true if worker was assigned, false if no free workers
   */
  assignFreeWorkerToTile(tileKey: TileKey): boolean {
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
    return true;
  }

  /**
   * Processes the task queue when workers become free.
   */
  processTaskQueue(): void {
    while (this.freeWorkers.length > 0 && this.taskQueue.length > 0) {
      const tileKey = this.taskQueue.shift()!;
      if (this.activeLoads.has(tileKey)) {
        // Still needs loading
        this.assignFreeWorkerToTile(tileKey);
      }
      // If not in activeLoads, it was cancelled or completed
    }
  }

  /**
   * Adds a worker to the free workers pool.
   */
  addFreeWorker(worker: Worker): void {
    this.freeWorkers.push(worker);
  }

  /**
   * Removes a worker from the free workers pool.
   */
  removeFreeWorker(worker: Worker): void {
    const index = this.freeWorkers.indexOf(worker);
    if (index >= 0) {
      this.freeWorkers.splice(index, 1);
    }
  }

  /**
   * Sets the worker for a tile in active loads.
   */
  setWorkerForTile(tileKey: TileKey, worker: Worker | null): void {
    const state = this.activeLoads.get(tileKey);
    if (state) {
      state.worker = worker;
    }
  }

  /**
   * Gets the active loads map.
   */
  getActiveLoads(): Map<TileKey, TileLoadState> {
    return this.activeLoads;
  }

  /**
   * Gets the task queue.
   */
  getTaskQueue(): TileKey[] {
    return [...this.taskQueue];
  }

  /**
   * Clean up resources.
   */
  destroy(): void {
    // Cleanup handled by TileLoaderCore
  }
}