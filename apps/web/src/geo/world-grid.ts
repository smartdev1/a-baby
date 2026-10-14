/**
 * Role: world-grid — conversions monde/tuiles simplifiées.
 * Owner: frontend
 *
 * Fonctions de conversion entre coordonnées mondiales et clés de tuiles,
 * sans dépendance externe lourde (osm, proj4). Utilisées par tile-loader.ts.
 */

import type { TileKey } from "./tile-keys.ts";

/** Taille d'une tuile L0 en mètres (côte d'une tuile de niveau 0) */
export const tileSizeM = 250; // 250m par tuile, conforme ADR 0002

/** Limites d'une tuile en mètres (coin SW et NE) */
export const tileBounds = {
  minX: -125,
  maxX: 125,
  minY: -125,
  maxY: 125,
};

/** Convertit une position (est, nord) en coordonnées de tuile (x, y, z) */
export function tileCoordOf(position: { eastingM: number; northingM: number }, zoom: number): {
  x: number;
  y: number;
  z: number;
} {
  // Conversion simplifiée : nombre de tuiles = est / taille_tuile
  const x = Math.floor(position.eastingM / tileSizeM);
  const y = Math.floor(position.northingM / tileSizeM);
  const z = zoom; // niveau de zoom
  return { x, y, z };
}

/** Convertit des coordonnées de tuile (x, y, z) en une clé de tuile */
export function tileKeyOf(x: number, y: number, z: number): TileKey {
  return `L0_${x}_${y}_${z}`;
}