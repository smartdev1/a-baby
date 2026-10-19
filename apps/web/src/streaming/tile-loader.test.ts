/**
 * Role: tile-loader.test — Unit tests for tile-loader.
 * Owner: frontend
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TileLoader } from './tile-loader';
import type { WorldRenderer } from './types';

// Mock Worker class
class MockWorker {
  onmessage: ((this: void, ev: MessageEvent<unknown>) => void) | null = null;
  onerror: ((this: void, ev: ErrorEvent) => void) | null = null;
  postedMessages: { message: unknown; transfer: Transferable[] | undefined }[] = [];

  postMessage(message: unknown, transfer?: Transferable[]): void {
    this.postedMessages.push({ message, transfer });
    // Simulate async message handling
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage({ data: message } as MessageEvent<unknown>);
      }
    }, 0);
  }

  terminate(): void {
    // Mock termination
  }
}

describe('TileLoader', () => {
  let loader: TileLoader;
  let worldRenderer: WorldRenderer;
  let originalWorker: unknown;
  const baseUrl = '/tiles/test/';

  beforeEach(() => {
    // Mock global Worker for this test
    originalWorker = global.Worker;
    (global as Record<string, unknown>).Worker = MockWorker;

    worldRenderer = {
      integrateTile: vi.fn()
    };

    loader = new TileLoader({
      baseUrl,
      worldRenderer,
      maxWorkers: 2,
      frameBudgetMs: 4,
      schedulerOptions: { radius: 1, throttleMs: 50 },
      cacheOptions: { sizeLimitMb: 5 }
    });
  });

  afterEach(() => {
    // Restore original Worker
    (global as Record<string, unknown>).Worker = originalWorker;
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      await loader.initialize();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(worldRenderer.integrateTile).not.toHaveBeenCalled();
    });
  });

  describe('updateCameraState', () => {
    it('should schedule tiles based on camera position', async () => {
      await loader.initialize();

      // Mock cache getStatus to return idle for all tiles
      const cache = loader.cache;
      const getStatusSpy = vi.spyOn(cache, 'getStatus');
      getStatusSpy.mockResolvedValue({ status: 'idle' });

      // Mock cache markLoading
      const markLoadingSpy = vi.spyOn(cache, 'markLoading');
      markLoadingSpy.mockResolvedValue(undefined);

      loader.updateCameraState({
        position: { x: 0, z: 0 },
        heading: 0,
        speed: 0
      });

      // Should have called markLoading for each tile in the 3x3 grid
      expect(markLoadingSpy).toHaveBeenCalledTimes(9);
    });

    it('should respect scheduler throttling', async () => {
      await loader.initialize();

      const cache = loader.cache;
      const getStatusSpy = vi.spyOn(cache, 'getStatus');
      getStatusSpy.mockResolvedValue({ status: 'idle' });

      const markLoadingSpy = vi.spyOn(cache, 'markLoading');
      markLoadingSpy.mockResolvedValue(undefined);

      // First update
      loader.updateCameraState({
        position: { x: 0, z: 0 },
        heading: 0,
        speed: 0
      });
      const firstCallCount = markLoadingSpy.mock.calls.length;

      // Second update immediately - should be throttled
      loader.updateCameraState({
        position: { x: 0, z: 0 },
        heading: 0,
        speed: 0
      });
      const secondCallCount = markLoadingSpy.mock.calls.length;

      expect(secondCallCount).toBe(firstCallCount); // No additional calls
    });
  });

  describe('tile loading flow', () => {
    it('should call worldRenderer.integrateTile when tile data is provided', async () => {
      await loader.initialize();

      const tileKey = 'L0_0_0';
      const mockManifest = {
        formatVersion: 1,
        tileKey,
        buildings: [],
        places: [],
        neighbours: []
      };

      // Access the workerPool through the loader and simulate a tile data response
      const workerPool = loader.workerPool;
      await workerPool.handleTileData({
        tileKey,
        manifest: mockManifest,
        glbScene: new ArrayBuffer(100),
        instances: new ArrayBuffer(50),
        collision: new ArrayBuffer(75)
      });

      // Should have called worldRenderer.integrateTile
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(worldRenderer.integrateTile).toHaveBeenCalledWith(
        tileKey,
        0, // level
        expect.objectContaining({
          meta: mockManifest,
          glbScene: expect.any(ArrayBuffer) as unknown as ArrayBuffer,
          instances: expect.any(ArrayBuffer) as unknown as ArrayBuffer,
          collision: expect.any(ArrayBuffer) as unknown as ArrayBuffer
        })
      );
    });

    it('should handle worker errors gracefully', async () => {
      await loader.initialize();

      const cache = loader.cache;
      const markFailedSpy = vi.spyOn(cache, 'markFailed');
      markFailedSpy.mockResolvedValue(undefined);

      // Access the workerPool through the loader and simulate a worker error
      const workerPool = loader.workerPool;
      workerPool.handleWorkerError('L0_0_0', new Error('Network timeout'));

      // Should have marked tile as failed
      expect(markFailedSpy).toHaveBeenCalledWith('L0_0_0', 'Worker error: Network timeout');
    });
  });

  describe('negative coordinate tile keys', () => {
    it('should handle tiles with negative coordinates', async () => {
      await loader.initialize();

      const tileKey = 'L0_-1_-2';
      const mockManifest = {
        formatVersion: 1,
        tileKey,
        buildings: [],
        places: [],
        neighbours: []
      };

      const workerPool = loader.workerPool;
      await workerPool.handleTileData({
        tileKey,
        manifest: mockManifest,
        glbScene: new ArrayBuffer(100),
        instances: new ArrayBuffer(50),
        collision: new ArrayBuffer(75)
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(worldRenderer.integrateTile).toHaveBeenCalledWith(
        tileKey,
        0,
        expect.objectContaining({
          meta: mockManifest
        })
      );
    });

    it('should handle worker error for negative coordinate tile', async () => {
      await loader.initialize();

      const cache = loader.cache;
      const markFailedSpy = vi.spyOn(cache, 'markFailed');
      markFailedSpy.mockResolvedValue(undefined);

      const workerPool = loader.workerPool;
      workerPool.handleWorkerError('L0_-3_-4', new Error('Not found'));

      expect(markFailedSpy).toHaveBeenCalledWith('L0_-3_-4', 'Worker error: Not found');
    });
  });

  describe('manifest validation', () => {
    it('should handle manifest with missing buildings array', async () => {
      await loader.initialize();

      const tileKey = 'L0_0_0';
      const invalidManifest = {
        formatVersion: 1,
        tileKey,
        places: [],
        neighbours: []
        // missing buildings
      };

      const workerPool = loader.workerPool;
      // Should not throw — integration may fail gracefully
      await expect(
        workerPool.handleTileData({
          tileKey,
          manifest: invalidManifest as unknown as Record<string, unknown>,
          glbScene: new ArrayBuffer(100),
          instances: null,
          collision: null
        })
      ).resolves.not.toThrow();
    });

    it('should handle manifest with null neighbours', async () => {
      await loader.initialize();

      const tileKey = 'L0_1_1';
      const manifestWithNullNeighbours = {
        formatVersion: 1,
        tileKey,
        buildings: [],
        places: [],
        neighbours: null
      };

      const workerPool = loader.workerPool;
      await expect(
        workerPool.handleTileData({
          tileKey,
          manifest: manifestWithNullNeighbours as unknown as Record<string, unknown>,
          glbScene: null,
          instances: null,
          collision: null
        })
      ).resolves.not.toThrow();
    });
  });

  describe('tile integration chunking', () => {
    it('should split 500 buildings into 7 chunks (80 per chunk)', async () => {
      await loader.initialize();

      const tileKey = 'L0_0_0';
      const buildings = Array.from({ length: 500 }, (_, i) => ({
        id: `b${i}`,
        type: 'residential',
        levels: 3,
        heightM: 12,
        heightSource: 'osm'
      }));

      const mockManifest = {
        formatVersion: 1,
        tileKey,
        buildings,
        places: [],
        neighbours: []
      };

      const workerPool = loader.workerPool;
      await workerPool.handleTileData({
        tileKey,
        manifest: mockManifest,
        glbScene: new ArrayBuffer(100),
        instances: new ArrayBuffer(50),
        collision: new ArrayBuffer(75)
      });

      // 500 / 80 = 6.25 → 7 chunks
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(worldRenderer.integrateTile).toHaveBeenCalledTimes(7);
    });

    it('should pass glbScene/instances/collision only on first chunk', async () => {
      await loader.initialize();

      const tileKey = 'L0_1_0';
      const buildings = Array.from({ length: 160 }, (_, i) => ({
        id: `b${i}`,
        type: 'residential',
        levels: 2,
        heightM: 10,
        heightSource: 'osm'
      }));

      const mockManifest = {
        formatVersion: 1,
        tileKey,
        buildings,
        places: [],
        neighbours: []
      };

      const workerPool = loader.workerPool;
      await workerPool.handleTileData({
        tileKey,
        manifest: mockManifest,
        glbScene: new ArrayBuffer(100),
        instances: new ArrayBuffer(50),
        collision: new ArrayBuffer(75)
      });

      // 160 / 80 = 2 chunks
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(worldRenderer.integrateTile).toHaveBeenCalledTimes(2);

      // First chunk has glbScene/instances/collision
      const firstCall = (worldRenderer.integrateTile as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(firstCall[2].glbScene).not.toBeNull();
      expect(firstCall[2].instances).not.toBeNull();
      expect(firstCall[2].collision).not.toBeNull();

      // Second chunk has null binaries
      const secondCall = (worldRenderer.integrateTile as ReturnType<typeof vi.fn>).mock.calls[1];
      expect(secondCall[2].glbScene).toBeNull();
      expect(secondCall[2].instances).toBeNull();
      expect(secondCall[2].collision).toBeNull();
    });

    it('should handle empty buildings array with single integrateTile call', async () => {
      await loader.initialize();

      const tileKey = 'L0_2_0';
      const mockManifest = {
        formatVersion: 1,
        tileKey,
        buildings: [],
        places: [],
        neighbours: []
      };

      const workerPool = loader.workerPool;
      await workerPool.handleTileData({
        tileKey,
        manifest: mockManifest,
        glbScene: null,
        instances: null,
        collision: null
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(worldRenderer.integrateTile).toHaveBeenCalledTimes(1);
    });

    it('should chunk buildings with at most 80 per chunk', async () => {
      await loader.initialize();

      const tileKey = 'L0_3_0';
      const buildings = Array.from({ length: 200 }, (_, i) => ({
        id: `b${i}`,
        type: 'residential',
        levels: 2,
        heightM: 10,
        heightSource: 'osm'
      }));

      const mockManifest = {
        formatVersion: 1,
        tileKey,
        buildings,
        places: [],
        neighbours: []
      };

      const workerPool = loader.workerPool;
      await workerPool.handleTileData({
        tileKey,
        manifest: mockManifest,
        glbScene: new ArrayBuffer(100),
        instances: new ArrayBuffer(50),
        collision: new ArrayBuffer(75)
      });

      // 200 / 80 = 2.5 → 3 chunks
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(worldRenderer.integrateTile).toHaveBeenCalledTimes(3);

      // Verify each chunk has at most 80 buildings
      const calls = (worldRenderer.integrateTile as ReturnType<typeof vi.fn>).mock.calls;
      for (const call of calls) {
        expect(call[2].meta.buildings.length).toBeLessThanOrEqual(80);
      }

      // Total buildings across chunks should equal 200
      const totalBuildings = calls.reduce(
        (sum: number, call: unknown[]) => sum + (call[2] as { meta: { buildings: unknown[] } }).meta.buildings.length,
        0
      );
      expect(totalBuildings).toBe(200);
    });
  });

  describe('cleanup', () => {
    it('should terminate workers on destroy', async () => {
      await loader.initialize();

      const terminateSpy = vi.spyOn(MockWorker.prototype, 'terminate');

      loader.destroy();

      // Should have terminated all workers
      expect(terminateSpy).toHaveBeenCalledTimes(loader.maxWorkers);
    });
  });
});
