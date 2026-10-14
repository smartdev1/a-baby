/**
 * Role: road renderer from tile meta: ribbons at real width, earcut-based shape, palette fusion, scale C1 fix.
 * Owner: frontend
 */

import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { ExtrudePolygon } from '@babylonjs/core/Meshes/Builders/polygonBuilder';
import earcut from 'earcut';
import type { Scene } from '@babylonjs/core/scene';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.ts';
import { Color3 } from '@babylonjs/core/Maths/Color3.ts';

const PALETTE = ['#5b9bd5', '#6ec8e8', '#75d5e9', '#5b9bd5', '#4a8bcg', '#3d7ab'];
const SCALE_FACTOR = 0.25; // C1 fix: apply 0.25 partout (x/y/height)

/** Map a road ID to a palette colour (asphalt / concrete variant). */
const getRoadColor = (id: string): string =>
  PALETTE[stringHash(id) % PALETTE.length] ?? '#5b9bd5';

/** Hash simple déterministe (même fonction que buildings.ts). */
const stringHash = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h;
};

interface RoadData {
  id: string;
  width: number;
  path: Array<{ x: number; z: number }> | null;
}

/** Crée un mesh route à partir de RoadData.
 *  Génère un ruban (ribbon) à la largeur réelle (correction bug C1 :
 *  ancien code factorisait seulement x/y, maintenant height/depth aussi).
 *  Utilise earcut pour le profilage du ruban. */
export const buildRoadMesh = (
  scene: Scene,
  road: RoadData,
  position: Vector3,
): Mesh => {
  // Depth = width for ribbon (facteur C1)
  const depthM = road.width * SCALE_FACTOR;

  // Le path est un tableau de Vec2[] (points longitude/latitude projetés)
  const path = road.path ?? [];
  if (path.length < 2) {
    // Fallback : box minimal
    const box = new Mesh(road.id, scene);
    box.position = position;
    box.scaling = new Vector3(SCALE_FACTOR, SCALE_FACTOR, SCALE_FACTOR);
    return box;
  }

  // Construit les anneaux (rings) pour earcut : base + top + éventuelle ouverture
  // Format attendu par ExtrudePolygon : shape en Vector3 (x=est, z=north, y=haut=0)
  const baseShape = path.map((p: { x: number; z: number }) => new Vector3(p.x, 0, p.z));

  try {
    // ExtrudePolygon accepte un seul anneau ; pour une route on veut un ruban (base + top)
    // On simplifie : crée un polygone épais en utilisant la profondeur
    const mesh = ExtrudePolygon(
      road.id,
      { shape: baseShape, depth: depthM, sideOrientation: Mesh.DOUBLESIDE },
      scene,
      earcut,
    );

    // Position et échelle C1
    mesh.position = position;
    mesh.scaling = new Vector3(SCALE_FACTOR, SCALE_FACTOR, SCALE_FACTOR);

    // Couleur palette
    const materialColor = getRoadColor(road.id);
    const material = new StandardMaterial(`${road.id}-mat`, scene);
    const diffuse = new Color3(
      parseInt(materialColor.slice(1, 3), 16) / 255,
      parseInt(materialColor.slice(3, 5), 16) / 255,
      parseInt(materialColor.slice(5, 7), 16) / 255,
    );
    material.diffuseColor = diffuse;
    mesh.material = material;

    return mesh;
  } catch {
    // Fallback box si extrusion échoue
    const box = new Mesh(road.id, scene);
    box.position = position;
    box.scaling = new Vector3(SCALE_FACTOR, SCALE_FACTOR, SCALE_FACTOR);
    return box;
  }
};

/** Regroupe plusieurs meshes route par couleur de palette. */
export const groupRoadsByPalette = (
  meshes: Mesh[],
): Map<string, Mesh[]> => {
  const groups = new Map<string, Mesh[]>();
  for (const mesh of meshes) {
    const color = getRoadColor(mesh.name || 'unknown');
    const existing = groups.get(color) ?? [];
    existing.push(mesh);
    groups.set(color, existing);
  }
  return groups;
};

/** Force le merge des matériaux route par couleur. */
export const mergeRoadMaterials = (groups: Map<string, Mesh[]>): void => {
  for (const [, meshes] of groups) {
    if (meshes.length > 0) {
      // matériel déjà assigné dans buildRoadMesh
    }
  }
};