/**
 * Role: geo-types — types de position géographique simplifiés.
 * Owner: frontend
 *
 * Types minimaux pour le chargement de tuiles, sans dépendance externe.
 * UtmPosition : position UTM simplifiée (est, nord en mètres).
 * TileKey : clé de tuile format L0.
 */
export type UtmPosition = {
  eastingM: number; // longitude en mètres
  northingM: number; // latitude en mètres
};

/** Clé de tuile L0 (niveau 0, le niveau le plus large) */
export type TileKey = string;

/** Parse une clé de tuile en ses composants */
export function parseTileKey(key: TileKey): {
  x: number;
  y: number;
  z: number;
} {
  // Parsing simplifié : la clé est "L0_X_Y"
  const parts = key.split('_');
  return {
    x: parseInt(parts[1]) || 0,
    y: parseInt(parts[2]) || 0,
    z: parseInt(parts[3]) || 0,
  };
}