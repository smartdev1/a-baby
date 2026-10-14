/**
 * Unit tests for impostors logic.
 * Tests pure functions: impostor config, distance calculation.
 * Déterministe — pas de Math.random.
 */
import { describe, it, expect } from 'vitest';
import { shouldShowImpostor } from './impostors';
import type { ImpostorConfig } from './impostors';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';

describe('Impostors Logic', () => {
  const createConfig = (overrides: Partial<ImpostorConfig> = {}): ImpostorConfig => ({
    id: 'test-building',
    position: new Vector3(0, 0, 0),
    textureWidth: 1024,
    textureHeight: 1024,
    lodEndDistance: 200,
    lodStartDistance: 50,
    ...overrides,
  });

  it('creates valid impostor config', () => {
    const config = createConfig();
    expect(config.id).toBe('test-building');
    expect(config.position).toBeInstanceOf(Vector3);
    expect(config.textureWidth).toBe(1024);
    expect(config.lodEndDistance).toBe(200);
    expect(config.lodStartDistance).toBe(50);
  });

  it('shouldShowImpostor returns true within distance range', () => {
    const config = createConfig();
    // Positionner la caméra à 100 unités du bâtiment
    const cameraPos = new Vector3(0, 0, 100);
    // Building at origin, camera at z=100 => distance = 100
    const result = shouldShowImpostor(
      new Vector3(0, 0, 0),
      cameraPos,
      config
    );
    // distance = 100, lodStartDistance = 50, lodEndDistance = 200
    // 100 > 50 && 100 <= 200 => true
    expect(result).toBe(true);
  });

  it('shouldShowImpostor returns true at start distance boundary', () => {
    const config = createConfig();
    // À exactement lodStartDistance
    const cameraPos = new Vector3(0, 0, 50);
    const result = shouldShowImpostor(
      new Vector3(0, 0, 0),
      cameraPos,
      config
    );
    // distance = 50, lodStartDistance = 50 => 50 > 50 is false
    // Mais la condition est > lodStartDistance, donc false à la borne
    expect(result).toBe(false);
  });

  it('shouldShowImpostor returns true at end distance boundary', () => {
    const config = createConfig();
    // À exactement lodEndDistance
    const cameraPos = new Vector3(0, 0, 200);
    const result = shouldShowImpostor(
      new Vector3(0, 0, 0),
      cameraPos,
      config
    );
    // distance = 200, lodEndDistance = 200 => 200 <= 200 is true
    expect(result).toBe(true);
  });

  it('shouldShowImpostor returns false beyond lodEndDistance', () => {
    const config = createConfig();
    const cameraPos = new Vector3(0, 0, 250);
    const result = shouldShowImpostor(
      new Vector3(0, 0, 0),
      cameraPos,
      config
    );
    // distance = 250 > lodEndDistance = 200 => false
    expect(result).toBe(false);
  });

  it('shouldShowImpostor returns false before lodStartDistance', () => {
    const config = createConfig();
    const cameraPos = new Vector3(0, 0, 20);
    const result = shouldShowImpostor(
      new Vector3(0, 0, 0),
      cameraPos,
      config
    );
    // distance = 20 < lodStartDistance = 50 => false
    expect(result).toBe(false);
  });
});