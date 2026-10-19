/**
 * Role: tile-scheduler.test — Unit tests for tile-scheduler.
 * Owner: frontend
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TileScheduler } from './tile-scheduler';

describe('TileScheduler', () => {
  let scheduler: TileScheduler;
  const mockCameraState = {
    position: { x: 0, z: 0 },
    heading: 0,
    speed: 0
  };

  beforeEach(() => {
    scheduler = new TileScheduler({ radius: 1, throttleMs: 100 });
  });

  describe('updateCameraState', () => {
    it('should return empty array when throttled', () => {
      // First call - should return tiles (scheduler is fresh, lastUpdateTime=0)
      const result1 = scheduler.updateCameraState(mockCameraState);
      expect(result1.length).toBeGreaterThan(0);

      // Second call immediately - should be throttled (same scheduler, recent lastUpdateTime)
      const result2 = scheduler.updateCameraState(mockCameraState);
      expect(result2).toEqual([]);
    });

    it('should calculate correct tile set for radius 1', () => {
      const result = scheduler.updateCameraState({
        position: { x: 0, z: 0 },
        heading: 0,
        speed: 0
      });

      // For position (0,0) with radius 1, we expect tiles from (-1,-1) to (1,1)
      // That's 3x3 = 9 tiles
      expect(result.length).toBe(9);

      // Check that all tiles are valid L0 format
      const tileKeyPattern = /^L0_-?\d+_-?\d+$/;
      result.forEach(tile => {
        expect(tileKeyPattern.test(tile)).toBe(true);
      });

      // Check specific tiles exist
      expect(result).toContain('L0_0_0');
      expect(result).toContain('L0_1_0');
      expect(result).toContain('L0_0_1');
      expect(result).toContain('L0_-1_-1');
    });

    it('should handle negative coordinates correctly', () => {
      const result = scheduler.updateCameraState({
        position: { x: -250, z: -250 }, // This should map to tile (-1, -1)
        heading: 0,
        speed: 0
      });

      // Center tile should be L0_-1_-1
      expect(result).toContain('L0_-1_-1');

      // With radius 1, should have tiles from (-2,-2) to (0,0)
      expect(result).toContain('L0_-2_-2');
      expect(result).toContain('L0_0_0');
    });

    it('should respect different radius values', () => {
      const schedulerSmall = new TileScheduler({ radius: 0, throttleMs: 100 });
      const resultSmall = schedulerSmall.updateCameraState(mockCameraState);
      expect(resultSmall.length).toBe(1); // Just the center tile
      expect(resultSmall).toContain('L0_0_0');

      const schedulerLarge = new TileScheduler({ radius: 2, throttleMs: 100 });
      const resultLarge = schedulerLarge.updateCameraState(mockCameraState);
      // Radius 2 gives 5x5 = 25 tiles
      expect(resultLarge.length).toBe(25);
    });
  });

  describe('tile key validation regex', () => {
    // The regex must be consistent between scheduler and worker.
    // Both must accept negative coordinates (Yopougon extends both sides of UTM origin).
    const tileKeyPattern = /^L0_-?\d+_-?\d+$/;

    it('should accept positive coordinates', () => {
      expect(tileKeyPattern.test('L0_0_0')).toBe(true);
      expect(tileKeyPattern.test('L0_296_178')).toBe(true);
      expect(tileKeyPattern.test('L0_1_0')).toBe(true);
    });

    it('should accept negative coordinates', () => {
      expect(tileKeyPattern.test('L0_-1_-1')).toBe(true);
      expect(tileKeyPattern.test('L0_-296_-178')).toBe(true);
      expect(tileKeyPattern.test('L0_-1_0')).toBe(true);
      expect(tileKeyPattern.test('L0_0_-1')).toBe(true);
    });

    it('should accept mixed-sign coordinates', () => {
      expect(tileKeyPattern.test('L0_-1_2')).toBe(true);
      expect(tileKeyPattern.test('L0_3_-4')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(tileKeyPattern.test('L0_0')).toBe(false);
      expect(tileKeyPattern.test('L0_0_0_0')).toBe(false);
      expect(tileKeyPattern.test('L1_0_0')).toBe(false);
      expect(tileKeyPattern.test('0_0_0')).toBe(false);
      expect(tileKeyPattern.test('L0_a_b')).toBe(false);
      expect(tileKeyPattern.test('')).toBe(false);
      expect(tileKeyPattern.test('L0_1.5_2')).toBe(false);
    });
  });

  describe('calculateTileSet (private method testing via public interface)', () => {
    it('should generate correct tile keys for given world position', () => {
      // Position at (500, 500) should be tile (2, 2) since 500/250 = 2
      const result = scheduler.updateCameraState({
        position: { x: 500, z: 500 },
        heading: 0,
        speed: 0
      });

      expect(result).toContain('L0_2_2');
      expect(result).toContain('L0_3_2'); // +1 in x
      expect(result).toContain('L0_2_3'); // +1 in z
      expect(result).toContain('L0_1_1'); // -1 in both
    });
  });
});
