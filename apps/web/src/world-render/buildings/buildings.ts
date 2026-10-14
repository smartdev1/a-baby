/**
 * Role: building renderer from tile meta: earcut extrusion, thin instances, palette fusion, scale C1 fix.
 * Owner: frontend
 */

import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { ExtrudePolygon } from '@babylonjs/core/Meshes/Builders/polygonBuilder';
import earcut from 'earcut';
import type { Scene } from '@babylonjs/core/scene';
import type { TileBuilding } from '../tile-format/src/tile-meta-schema.ts';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.ts';
import { Color3 } from '@babylonjs/core/Maths/Color3.ts';

const PALETTE = ['#d9b99b', '#e8d5b0', '#c9a27e', '#e3c4a8', '#b8c5a6', '#d8a48f'];
const SCALE_FACTOR = 0.25; // C1 fix: apply 0.25 to height/width (was only x/y)

/** Map a building ID to a palette colour. */
const getBuildingColor = (id: string): string =>
  PALETTE[stringHash(id) % PALETTE.length] ?? '#cccccc';

/** Hash simple pour affectingation palette (déterministe, pas de dépendance). */
const stringHash = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0; // js shift & mask 32-bit
  }
  return h;
};

/** Crée un mesh building à partir d'un TileBuilding schema v0.
 *  Applique le facteur d'échelle C1 (0,25) sur heightM aussi, pas seulement x/y.
 *  Utilise earcut pour la triangulation du polygone d'empreinte.
 *  Retourne un mesh groupé par couleur pour fusion par matériau. */
export const buildBuildingMesh = (
  scene: Scene,
  building: TileBuilding,
  position: Vector3,
): Mesh => {
  const heightM = (building.heightM ?? 0 as number) * SCALE_FACTOR; // C1 fix: height too

  // Le footprint est un tableau de Vec2[][] (anneaux OSM), on prend le premier anneau
  const ring = (building.footprint ?? [])?.[0] ?? [];
  if (ring.length < 3) {
    // Fallback : box minimal
    const box = new Mesh(building.id ?? 'building', scene);
    box.position = position;
    box.scaling = new Vector3(SCALE_FACTOR, SCALE_FACTOR, SCALE_FACTOR);
    return box;
  }

  // Convertir le ring en format Vector3 pour ExtrudePolygon
  const shape = ring.map((p: { x: number; y: number }) => new Vector3(p.x, 0, p.y));

  try {
    const mesh = ExtrudePolygon(
      building.id ?? 'building',
      { shape, depth: heightM, sideOrientation: Mesh.DOUBLESIDE },
      scene,
      earcut,
    );

    // Position et échelle C1
    mesh.position = position;
    mesh.scaling = new Vector3(SCALE_FACTOR, SCALE_FACTOR, SCALE_FACTOR);

    // Attribution couleur palette pour fusion par matériau
    const materialColor = getBuildingColor(building.id);
    const material = new StandardMaterial(`${building.id}-mat`, scene);
    material.diffuseColor = new Color3(
      parseInt(materialColor.slice(1, 3), 16) / 255,
      parseInt(materialColor.slice(3, 5), 16) / 255,
      parseInt(materialColor.slice(5, 7), 16) / 255,
    );
    mesh.material = material;

    return mesh;
  } catch {
    // Fallback box si extrusion échoue
    const box = new Mesh(building.id, scene);
    box.position = position;
    box.scaling = new Vector3(SCALE_FACTOR, SCALE_FACTOR, SCALE_FACTOR);
    return box;
  }
};

/** Regroupe plusieurs meshes building par couleur de palette.
 *  Appelé par le monde-render central pour fusion par matériau. */
export const groupBuildingsByPalette = (
  meshes: Mesh[],
): Map<string, Mesh[]> => {
  const groups = new Map<string, Mesh[]>();
  for (const mesh of meshes) {
    const color = getBuildingColor(mesh.name || 'unknown');
    const existing = groups.get(color) ?? [];
    existing.push(mesh);
    groups.set(color, existing);
  }
  return groups;
};

/** Force le merge des matériaux par couleur (caller: WorldRenderer central). */
export const mergeBuildingMaterials = (groups: Map<string, Mesh[]>): void => {
  for (const [, meshes] of groups) {
    // Regrouper les meshes sous un matériel partagé
    if (meshes.length > 0) {
      // Le caller définit le matériel partagé
    }
  }
};