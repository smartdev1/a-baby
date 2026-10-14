/**
 * Unit tests for vegetation-types logic.
 * Tests pure functions: species definitions, LOD parameters.
 * Déterministe — pas de Math.random.
 */
import { describe, it, expect } from 'vitest';
import { TREE_SPECIES, SHRUB_SPECIES, GROUND_COVER_SPECIES, ALL_VEGETATION_SPECIES } from './vegetation-types';

describe('Vegetation Types', () => {
  it('has tree species defined', () => {
    expect(TREE_SPECIES.length).toBe(3);
    // Vérifier les 3 espèces d'arbres
    expect(TREE_SPECIES[0].key).toBe('okoume');
    expect(TREE_SPECIES[1].key).toBe('filao');
    expect(TREE_SPECIES[2].key).toBe('mangrove_nord');
  });

  it('has shrub species defined', () => {
    expect(SHRUB_SPECIES.length).toBe(2);
    expect(SHRUB_SPECIES[0].key).toBe('tiroir');
    expect(SHRUB_SPECIES[1].key).toBe('helleba');
  });

  it('has ground cover species defined', () => {
    expect(GROUND_COVER_SPECIES.key).toBe('herbe_ciplante');
    expect(GROUND_COVER_SPECIES.maxHeight).toBe(0.5);
  });

  it('ALL_VEGETATION_SPECIES combines all types', () => {
    // 3 arbres + 2 arbustes = 5 espèces au total
    expect(ALL_VEGETATION_SPECIES.length).toBe(5);
    expect(ALL_VEGETATION_SPECIES[0].key).toBe('okoume');
    expect(ALL_VEGETATION_SPECIES[3].key).toBe('tiroir');
  });

  it('LOD parameters are valid', () => {
    // Vérifier que tous les arbres ont des paramètres LOD valides
    TREE_SPECIES.forEach((species) => {
      expect(species.lodLevels).toBeGreaterThan(0);
      expect(species.lodStartDistance).toBeGreaterThan(0);
      expect(species.lodEndDistance).toBeGreaterThan(species.lodStartDistance);
      expect(species.densityFactor).toBeGreaterThanOrEqual(0);
      expect(species.densityFactor).toBeLessThanOrEqual(1);
    });
  });

  it('shrub LOD parameters are valid', () => {
    SHRUB_SPECIES.forEach((species) => {
      expect(species.lodLevels).toBeGreaterThan(0);
      expect(species.lodStartDistance).toBeGreaterThan(0);
      expect(species.lodEndDistance).toBeGreaterThan(species.lodStartDistance);
    });
  });
});