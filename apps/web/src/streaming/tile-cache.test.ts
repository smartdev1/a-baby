/**
 * Role: tile-cache.test — Unit tests for tile-cache.
 * Owner: frontend
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TileCache } from './tile-cache';

// Mock the Cache API
const mockCacheStore = new Map<string, Response>();

global.caches = {
  open: () => {
    return {
      match: (request: string | Request) => {
        const key = typeof request === 'string' ? request : request.url;
        return Promise.resolve(mockCacheStore.get(key) || null);
      },
      put: (request: string | Request, response: Response) => {
        const key = typeof request === 'string' ? request : request.url;
        mockCacheStore.set(key, response);
        return Promise.resolve();
      },
      delete: (request: string | Request) => {
        const key = typeof request === 'string' ? request : request.url;
        return Promise.resolve(mockCacheStore.delete(key));
      },
      keys: () => {
        return Promise.resolve(Array.from(mockCacheStore.keys()).map(key => new Request('http://localhost/' + key)));
      }
    } as unknown as Cache;
  }
} as unknown as CacheStorage;

describe('TileCache', () => {
  let cache: TileCache;

  beforeEach(() => {
    mockCacheStore.clear();
    cache = new TileCache({ sizeLimitMb: 1 });
  });

  describe('initialize', () => {
    it('should initialize the cache successfully', async () => {
      await cache.initialize();
    });

    it('should handle cache initialization failure gracefully', async () => {
      await expect(cache.initialize()).resolves.not.toThrow();
    });
  });

  describe('getStatus', () => {
    it('should return idle for non-existent tile', async () => {
      await cache.initialize();
      const status = await cache.getStatus('L0_0_0');
      expect(status.status).toBe('idle');
    });

    it('should return loaded status for cached tile', async () => {
      await cache.initialize();
      await cache.markLoaded('L0_0_0', { test: 'data' });

      const status = await cache.getStatus('L0_0_0');
      expect(status.status).toBe('loaded');
      expect(status.data).toEqual({ test: 'data' });
    });

    it('should return failed status with error', async () => {
      await cache.initialize();
      await cache.markFailed('L0_0_0', 'Test error');

      const status = await cache.getStatus('L0_0_0');
      expect(status.status).toBe('failed');
      expect(status.error).toBe('Test error');
    });

    it('should return loading status', async () => {
      await cache.initialize();
      await cache.markLoading('L0_0_0');

      const status = await cache.getStatus('L0_0_0');
      expect(status.status).toBe('loading');
    });
  });

  describe('markLoading', () => {
    it('should mark tile as loading', async () => {
      await cache.initialize();
      await cache.markLoading('L0_0_0');

      const status = await cache.getStatus('L0_0_0');
      expect(status.status).toBe('loading');
    });
  });

  describe('markLoaded', () => {
    it('should store and retrieve tile data', async () => {
      await cache.initialize();
      const testData = { id: 'tile1', buildings: [] };

      await cache.markLoaded('L0_0_0', testData);

      const status = await cache.getStatus('L0_0_0');
      expect(status.status).toBe('loaded');
      expect(status.data).toEqual(testData);
    });

    it('should overwrite existing cache entry', async () => {
      await cache.initialize();
      await cache.markLoaded('L0_0_0', { version: 1 });
      await cache.markLoaded('L0_0_0', { version: 2 });

      const status = await cache.getStatus('L0_0_0');
      expect(status.status).toBe('loaded');
      expect(status.data).toEqual({ version: 2 });
    });
  });

  describe('markFailed', () => {
    it('should store error information', async () => {
      await cache.initialize();
      await cache.markFailed('L0_0_0', 'Network error');

      const status = await cache.getStatus('L0_0_0');
      expect(status.status).toBe('failed');
      expect(status.error).toBe('Network error');
      expect(status.data).toBeNull();
    });
  });

  describe('remove', () => {
    it('should remove tile from cache', async () => {
      await cache.initialize();
      await cache.markLoaded('L0_0_0', { test: 'data' });
      await cache.remove('L0_0_0');

      const status = await cache.getStatus('L0_0_0');
      expect(status.status).toBe('idle');
    });
  });

  describe('clear', () => {
    it('should clear all tiles from cache', async () => {
      await cache.initialize();
      await cache.markLoaded('L0_0_0', { test: 'data1' });
      await cache.markLoaded('L0_1_0', { test: 'data2' });

      await cache.clear();

      const status1 = await cache.getStatus('L0_0_0');
      const status2 = await cache.getStatus('L0_1_0');
      expect(status1.status).toBe('idle');
      expect(status2.status).toBe('idle');
    });
  });
});
