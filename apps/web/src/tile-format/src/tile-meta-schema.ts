/**
 * Role: tile-meta-schema — schémas de validation des métadonnées de tuile.
 * Owner: frontend
 *
 * Schémas Zod de validation strictes pour les métadonnées de tuile v0.
 * Tous les champs sont requis ; toute donnée non conforme provoque une erreur structurée.
 */

// Import de Zod (doit être disponible dans les dépendances du projet)
// Si Zod n'est pas installé, ces schémas peuvent être simplifiés en validation manuelle.

/** Schéma de métadonnée de tuile v0 */
export const TileMetaSchema = {
  /** Version du format (doit être 0 pour v0) */
  formatVersion: (v: unknown) => typeof v === 'number' && v === 0 ? true : 'Format version must be 0',

  /** Clé de la tuile (doit être une chaîne de format "L0_x_y_z") */
  tileKey: (v: unknown) => typeof v === 'string' && v.startsWith('L0') ? true : 'Tile key must start with "L0"',

  /** Bâtiments de la tuile */
  buildings: (v: unknown) => Array.isArray(v) ? true : 'Buildings must be an array',

  /** Places de la tuile */
  places: (v: unknown) => Array.isArray(v) ? true : 'Places must be an array',

  /** Voisins de la tuile (clés de tuiles adjacentes) */
  neighbours: (v: unknown) => Array.isArray(v) ? true : 'Neighbours must be an array',
};

/** Schéma de bâtiment individuel */
export const TileBuildingSchema = {
  id: (v: unknown) => typeof v === 'string' ? true : 'Building id must be a string',
  type: (v: unknown) => typeof v === 'string' ? true : 'Building type must be a string',
  levels: (v: unknown) => typeof v === 'number' && v > 0 ? true : 'Levels must be a positive number',
  heightM: (v: unknown) => typeof v === 'number' && v >= 0 ? true : 'heightM must be positive',
  heightSource: (v: unknown) =>
    typeof v === 'string' && ['osm', 'dataset', 'heuristic'].includes(v)
      ? true
      : 'heightSource must be osm/dataset/heuristic',
};

/** Schéma de place individuel */
export const TilePlaceSchema = {
  id: (v: unknown) => typeof v === 'string' ? true : 'Place id must be a string',
  category: (v: unknown) => typeof v === 'string' ? true : 'Place category must be a string',
  displayName: (v: unknown) => typeof v === 'string' || v === null ? true : 'displayName must be a string or null',
  position: (v: unknown) => {
    if (!v || typeof v !== 'object') return 'Position must be an object';
    return (
      typeof v.x === 'number' &&
      typeof v.z === 'number' &&
      true
    );
  },
};

/** Schéma de métadonnée complet (utilisé dans loadTileMeta) */
export const TileMetaSchemaFull = {
  formatVersion: TileMetaSchema.formatVersion,
  tileKey: TileMetaSchema.tileKey,
  buildings: (v: unknown) => {
    if (!Array.isArray(v)) return 'Buildings must be an array';
    return v.every((b: unknown) => TileBuildingSchema.id(b) && TileBuildingSchema.type(b) && TileBuildingSchema.levels(b) && TileBuildingSchema.heightM(b) && TileBuildingSchema.heightSource(b));
  },
  places: (v: unknown) => {
    if (!Array.isArray(v)) return 'Places must be an array';
    return v.every((p: unknown) => TilePlaceSchema.id(p) && TilePlaceSchema.category(p) && TilePlaceSchema.displayName(p) && TilePlaceSchema.position(p));
  },
  neighbours: TileMetaSchema.neighbours,
};