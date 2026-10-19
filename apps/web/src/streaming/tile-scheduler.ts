/**
 * Role: tile-scheduler — Calculates desired tile set based on camera state with throttling.
 * Owner: frontend
 *
 * Determines which tiles should be loaded around the player based on camera position,
 * heading, and speed. Implements throttling to limit updates to 4Hz (every 250ms).
 */

import type { TileKey } from '@skyline/tile-format';

interface CameraState {
  position: { x: number; z: number };
  heading: number; // radians, 0 = +X, PI/2 = -Z
  speed: number; // m/s
}

interface TileSchedulerOptions {
  /** Radius in tiles around camera to load (default: 2 loads 5x5 tiles) */
  radius?: number;
  /** Throttle interval in ms (default: 250 for 4Hz) */
  throttleMs?: number;
}

/**
 * Calculates tile keys that should be loaded based on camera state.
 * Uses a simple grid around the camera position.
 */
export class TileScheduler {
  private lastUpdateTime = 0;
  private readonly radius: number;
  private readonly throttleMs: number;
  private pendingCameraState: CameraState | null = null;

  constructor(options: TileSchedulerOptions = {}) {
    this.radius = options.radius ?? 2;
    this.throttleMs = options.throttleMs ?? 250;
  }

  /**
   * Updates the camera state and returns tile keys if enough time has passed.
   * @returns Array of tile keys to load, or empty array if throttled.
   */
  updateCameraState(cameraState: CameraState): TileKey[] {
    // Store latest state
    this.pendingCameraState = cameraState;

    const now = performance.now();
    if (now - this.lastUpdateTime < this.throttleMs) {
      // Throttled - return empty array (no change)
      return [];
    }

    // Process pending state
    this.lastUpdateTime = now;
    const state = this.pendingCameraState;
    this.pendingCameraState = null;

    if (!state) {
      return [];
    }

    return this.calculateTileSet(state);
  }

  /**
   * Calculates the set of tile keys that should be loaded around the camera.
   * @param cameraState Current camera state
   * @returns Array of tile keys
   */
  private calculateTileSet(cameraState: CameraState): TileKey[] {
    const tileKeys: TileKey[] = [];

    // Convert world position to tile coordinates
    // Each tile is 250m, so divide by 250
    const tileX = Math.floor(cameraState.position.x / 250);
    const tileZ = Math.floor(cameraState.position.z / 250);

    // Generate grid of tiles around camera
    for (let dx = -this.radius; dx <= this.radius; dx++) {
      for (let dz = -this.radius; dz <= this.radius; dz++) {
        const key = `L0_${tileX + dx}_${tileZ + dz}`;
        // Validate that this is a proper TileKey format
        if (/^L0_-?\d+_-?\d+$/.test(key)) {
          tileKeys.push(key as TileKey);
        }
      }
    }

    return tileKeys;
  }

  /**
   * Gets the current camera state without triggering an update.
   * Useful for debugging or external access.
   */
  getPendingCameraState(): CameraState | null {
    return this.pendingCameraState;
  }
}