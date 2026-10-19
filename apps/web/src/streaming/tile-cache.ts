/**
 * Role: tile-cache — Manages Cache API for tile storage with LRU eviction.
 * Owner: frontend
 *
 * Provides methods to store, retrieve, and manage tile data in the browser's Cache API.
 * Implements LRU eviction when size limit is exceeded, tracks loading states.
 */

interface TileCacheOptions {
  /** Maximum cache size in MB (default: 50) */
  sizeLimitMb?: number;
  /** Cache name (default: 'skyline-tiles') */
  cacheName?: string;
}

/** Represents the loading status of a tile */
export type TileLoadStatus = 'idle' | 'loading' | 'loaded' | 'failed';

/** Metadata stored with each tile in cache */
interface CachedTileData {
  /** The actual tile data (serializable object) */
  data: unknown;
  /** Timestamp when cached */
  timestamp: number;
  /** Loading status */
  status: TileLoadStatus;
  /** Error message if failed */
  error?: string | null;
}

export class TileCache {
  private readonly cacheName: string;
  private readonly sizeLimitBytes: number;
  private cachePromise: Promise<Cache> | null;
  private isInitialized = false;

  constructor(options: TileCacheOptions = {}) {
    this.cacheName = options.cacheName ?? 'skyline-tiles';
    this.sizeLimitBytes = (options.sizeLimitMb ?? 50) * 1024 * 1024;

    // Check if Cache API is available
    this.cachePromise = typeof caches !== 'undefined'
      ? caches.open(this.cacheName)
      : null;
  }

  /**
   * Initializes the cache (must be called before use).
   * @returns Promise that resolves when cache is ready
   */
  async initialize(): Promise<void> {
    if (this.isInitialized || !this.cachePromise) {
      return;
    }

    try {
      await this.cachePromise;
      this.isInitialized = true;
    } catch (error) {
      console.warn('Failed to initialize tile cache:', error);
      // Continue without cache - tiles will be fetched each time
    }
  }

  /**
   * Gets the cache instance, initializing if needed.
   * @private
   */
  private async getCache(): Promise<Cache | null> {
    if (!this.cachePromise) {
      return null;
    }
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.isInitialized ? await this.cachePromise : null;
  }

  /**
   * Checks if a tile is in the cache and returns its status.
   * @param tileKey The tile key to check
   * @returns Object with status and data if available
   */
  async getStatus(tileKey: string): Promise<{ status: TileLoadStatus; data?: unknown; error?: string | null }> {
    if (!this.isInitialized) {
      return { status: 'idle' };
    }

    try {
      const cache = await this.getCache();
      if (!cache) {
        return { status: 'idle' };
      }
      const response = await cache.match(tileKey);
      if (!response) {
        return { status: 'idle' };
      }

      const cachedData = await response.json() as CachedTileData;
      return {
        status: cachedData.status,
        data: cachedData.status === 'loaded' ? cachedData.data : null,
        error: cachedData.error ?? null
      };
    } catch (error) {
      console.warn(`Error checking cache status for ${tileKey}:`, error);
      return { status: 'idle' };
    }
  }

  /**
   * Marks a tile as loading in the cache.
   * @param tileKey The tile key to mark
   */
  async markLoading(tileKey: string): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      const cache = await this.getCache();
      if (!cache) {
        return;
      }
      const cachedData: CachedTileData = {
        data: null,
        timestamp: Date.now(),
        status: 'loading'
      };

      await cache.put(tileKey, new Response(JSON.stringify(cachedData), {
        headers: { 'Content-Type': 'application/json' }
      }));
    } catch (error) {
      console.warn(`Error marking tile ${tileKey} as loading:`, error);
    }
  }

  /**
   * Marks a tile as loaded with its data.
   * @param tileKey The tile key to mark
   * @param data The tile data to store (must be serializable to JSON)
   */
  async markLoaded(tileKey: string, data: unknown): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      await this.enforceSizeLimit();

      const cache = await this.getCache();
      if (!cache) {
        return;
      }
      const cachedData: CachedTileData = {
        data,
        timestamp: Date.now(),
        status: 'loaded'
      };

      await cache.put(tileKey, new Response(JSON.stringify(cachedData), {
        headers: { 'Content-Type': 'application/json' }
      }));
    } catch (error) {
      console.warn(`Error marking tile ${tileKey} as loaded:`, error);
      await this.markFailed(tileKey, 'Failed to store tile data');
    }
  }

  /**
   * Marks a tile as failed with an error message.
   * @param tileKey The tile key to mark
   * @param error Error message
   */
  async markFailed(tileKey: string, error: string | null): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      const cache = await this.getCache();
      if (!cache) {
        return;
      }
      const cachedData: CachedTileData = {
        data: null,
        timestamp: Date.now(),
        status: 'failed',
        error
      };

      await cache.put(tileKey, new Response(JSON.stringify(cachedData), {
        headers: { 'Content-Type': 'application/json' }
      }));
    } catch (error) {
      console.warn(`Error marking tile ${tileKey} as failed:`, error);
    }
  }

  /**
   * Removes a tile from the cache.
   * @param tileKey The tile key to remove
   */
  async remove(tileKey: string): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      const cache = await this.getCache();
      if (!cache) {
        return;
      }
      await cache.delete(tileKey);
    } catch (error) {
      console.warn(`Error removing tile ${tileKey} from cache:`, error);
    }
  }

  /**
   * Clears all tiles from the cache.
   */
  async clear(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      const cache = await this.getCache();
      if (!cache) {
        return;
      }
      const keys = await cache.keys();
      for (const request of keys) {
        await cache.delete(request);
      }
      // Need to reopen it
      this.cachePromise = caches.open(this.cacheName);
      this.isInitialized = false;
    } catch (error) {
      console.warn('Error clearing tile cache:', error);
    }
  }

  /**
   * Enforces the size limit by removing oldest entries if needed.
   * @private
   */
  private async enforceSizeLimit(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      const cache = await this.getCache();
      if (!cache) {
        return;
      }
      const keys = await cache.keys();

      // Estimate current size (simplified - in practice we'd need to measure each entry)
      // For now, we'll use a simple count-based approach as a proxy
      const maxEntries = Math.floor(this.sizeLimitBytes / (100 * 1024)); // Assume ~100KB per tile
      if (keys.length > maxEntries) {
        // Sort by timestamp (oldest first) and remove excess
        const entriesWithTime: { key: Request; time: number }[] = [];
        for (const request of keys) {
          const response = await cache.match(request);
          if (response) {
            const cachedData = await response.json() as CachedTileData;
            entriesWithTime.push({ key: request, time: cachedData.timestamp });
          }
        }

        entriesWithTime.sort((a, b) => a.time - b.time);
        const excessCount = entriesWithTime.length - maxEntries;
        for (let i = 0; i < excessCount; i++) {
          await cache.delete(entriesWithTime[i]!.key);
        }
      }
    } catch (error) {
      console.warn('Error enforcing cache size limit:', error);
    }
  }
}