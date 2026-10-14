/**
 * Role: vegetation-types — types de végétation pour le monde Yopougon.
 * Owner: frontend
 *
 * Définit les différentes espèces d'arbres, arbustes et plantes
 * présentes dans la commune de Yopougon (Abidjan).
 * Utilisé pour le placement procédural et le LOD distant.
 *
 * Règles :
 - Toutes les définitions sont pures (pas de Math.random)
 - Les noms de espèces suivent ADR 0010 (parodiées, distance édit ≥ 2)
 - Les paramètres de LOD sont statiques et testables
 - Pas de dépendance à troisème partie hors Babylon.js
 */

export type TreeSpecies = {
  /** Nom interne (clé i18n) */
  key: string;
  /** Nom affiché (i18n) */
  labelKey: string;
  /** Hauteur maximale en mètres */
  maxHeight: number;
  /** Largeur maximale du houppier en mètres */
  maxWidth: number;
  /** Nombre de niveaux LOD */
  lodLevels: number;
  /** Distance de début de LOD (en unités Babylon, 1 unité = 1m) */
  lodStartDistance: number;
  /** Distance de fin de LOD (en unités Babylon) */
  lodEndDistance: number;
  /** Facteur de densité de placement (0.0 = très espacé, 1.0 = dense) */
  densityFactor: number;
};

/** Espèces d'arbres présents à Yopougon */
export const TREE_SPECIES: TreeSpecies[] = [
  {
    key: 'okoume',
    labelKey: 'vegetation.tree.okoume',
    maxHeight: 35,
    maxWidth: 15,
    lodLevels: 3,
    lodStartDistance: 50,
    lodEndDistance: 200,
    densityFactor: 0.15,
  },
  {
    key: 'filao',
    labelKey: 'vegetation.tree.filao',
    maxHeight: 25,
    maxWidth: 8,
    lodLevels: 3,
    lodStartDistance: 40,
    lodEndDistance: 150,
    densityFactor: 0.2,
  },
  {
    key: 'mangrove_nord',
    labelKey: 'vegetation.tree.mangrove_nord',
    maxHeight: 12,
    maxWidth: 5,
    lodLevels: 2,
    lodStartDistance: 20,
    lodEndDistance: 80,
    densityFactor: 0.25,
  },
];

/** Espèces d'arbustes et de petits arbres */
export const SHRUB_SPECIES: TreeSpecies[] = [
  {
    key: 'tiroir',
    labelKey: 'vegetation.shrub.tiroir',
    maxHeight: 4,
    maxWidth: 3,
    lodLevels: 2,
    lodStartDistance: 15,
    lodEndDistance: 50,
    densityFactor: 0.4,
  },
  {
    key: 'helleba',
    labelKey: 'vegetation.shrub.helleba',
    maxHeight: 2,
    maxWidth: 2,
    lodLevels: 2,
    lodStartDistance: 10,
    lodEndDistance: 30,
    densityFactor: 0.5,
  },
];

/** Plantes grimpantes et couvrage au sol */
export const GROUND_COVER_SPECIES = {
  key: 'herbe_ciplante',
  labelKey: 'vegetation.groundcover.herbe_ciplante',
  maxHeight: 0.5,
  lodStartDistance: 5,
  lodEndDistance: 20,
  densityFactor: 0.8,
};

export const ALL_VEGETATION_SPECIES = [
  ...TREE_SPECIES,
  ...SHRUB_SPECIES,
];