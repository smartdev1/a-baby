/**
 * Role: tile-keys — clés et parsing de tuiles simplifiés.
 * Owner: frontend
 *
 * Types et fonctions de parsing pour les clés de tuile L0,
 * utilisées par le tile-loader et d'autres modules.
 */

/** Clé de tuile L0 (niveau 0, le niveau le plus large) */
export type TileKey = string;

/** Parse une clé de tuile en ses composants */
export function parseTileKey(key: TileKey): {
  x: number;
  y: number;
  z: number;
} {
  // Parsing simplifié : la clé est "L0_X_Y_Z"
  const parts = key.split('_');
  return {
    x: parseInt(parts[1]) || 0,
    y: parseInt(parts[2]) || 0,
    z: parseInt(parts[3]) || 0,
  };
}