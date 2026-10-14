/**
 * Unit tests for LOD manager logic - pure functions only.
 * Tests LOD state transitions without class complexity.
 * Déterministe — pas de Math.random.
 */
import { describe, it, expect } from 'vitest';

// Structure de test: mesh + config simples
type TestConfig = {
  lodEndDistance: number;
  lodStartDistance: number;
};

/** Calcule le LOD courant en fonction de la distance caméra-objet */
const computeLOD = (
  cameraPos: { x: number; y: number; z: number },
  objPos: { x: number; y: number; z: number },
  config: TestConfig
): number => {
  const dx = objPos.x - cameraPos.x;
  const dy = objPos.y - cameraPos.y;
  const dz = objPos.z - cameraPos.z;
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

  if (distance <= config.lodStartDistance) return 0;
  if (distance <= config.lodEndDistance) return 1;
  return 2;
};

/** Détermine si un objet doit être en mode impostor */
const shouldShowImpostor = (
  cameraPos: { x: number; y: number; z: number },
  objPos: { x: number; y: number; z: number },
  config: TestConfig
): boolean => {
  const dx = objPos.x - cameraPos.x;
  const dy = objPos.y - cameraPos.y;
  const dz = objPos.z - cameraPos.z;
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
  return distance > config.lodStartDistance && distance <= config.lodEndDistance;
};

describe('LOD Logic (pure functions)', () => {
  const cameraPos = { x: 0, y: 0, z: 0 };
  const config: TestConfig = { lodEndDistance: 200, lodStartDistance: 50 };

  it('returns LOD0 for objects very close to camera', () => {
    // Objet à 10 unités => distance = 10 < lodStartDistance = 50 => LOD0
    const lod = computeLOD(cameraPos, { x: 10, y: 0, z: 0 }, config);
    expect(lod).toBe(0);
  });

  it('returns LOD1 for objects at medium distance', () => {
    // Objet à 100 unités => lodStartDistance < distance <= lodEndDistance => LOD1
    const lod = computeLOD(cameraPos, { x: 100, y: 0, z: 0 }, config);
    expect(lod).toBe(1);
  });

  it('returns LOD2 for objects far from camera', () => {
    // Objet à 300 unités => distance > lodEndDistance => LOD2
    const lod = computeLOD(cameraPos, { x: 300, y: 0, z: 0 }, config);
    expect(lod).toBe(2);
  });

  it('shouldShowImpostor returns true within distance range', () => {
    // Objet à 100 unités, lodStartDistance = 50, lodEndDistance = 200
    // 100 > 50 && 100 <= 200 => true
    const result = shouldShowImpostor(cameraPos, { x: 100, y: 0, z: 0 }, config);
    expect(result).toBe(true);
  });

  it('shouldShowImpostor returns false beyond lodEndDistance', () => {
    // Objet à 300 unités > lodEndDistance = 200 => false
    const result = shouldShowImpostor(cameraPos, { x: 300, y: 0, z: 0 }, config);
    expect(result).toBe(false);
  });

  it('shouldShowImpostor returns false before lodStartDistance', () => {
    // Objet à 20 unités < lodStartDistance = 50 => false
    const result = shouldShowImpostor(cameraPos, { x: 20, y: 0, z: 0 }, config);
    expect(result).toBe(false);
  });
});