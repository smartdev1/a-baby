/**
 * Role: extrudes legacy building footprints (earcut triangulation, box fallback), merged by palette colour.
 * Owner: frontend
 */

import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { ExtrudePolygon } from '@babylonjs/core/Meshes/Builders/polygonBuilder';
import type { Scene } from '@babylonjs/core/scene';
import earcut from 'earcut';
import { type BlockoutMaterials, pushToGroup } from './blockout-materials.ts';
import type { BuildingData, Vec2 } from './blockout-types.ts';
import { openRing, stringHash } from './polyline.ts';

const PALETTE = ['#d9b99b', '#e8d5b0', '#c9a27e', '#e3c4a8', '#b8c5a6', '#d8a48f'];
const MIN_HEIGHT_M = 3;

const boxFromRing = (scene: Scene, id: string, ring: readonly Vec2[], heightM: number): Mesh => {
  const xs = ring.map((p) => p.x);
  const ys = ring.map((p) => p.y);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const box = CreateBox(
    id,
    { width: Math.max(maxX - minX, 1), height: heightM, depth: Math.max(maxY - minY, 1) },
    scene,
  );
  box.position.set((minX + maxX) / 2, heightM / 2, (minY + maxY) / 2);
  return box;
};

const extrude = (scene: Scene, building: BuildingData): Mesh | null => {
  const ring = openRing(building.footprint[0] ?? []);
  if (ring.length < 3) return null;
  const heightM = Math.max(building.height, MIN_HEIGHT_M);
  try {
    const shape = ring.map((p) => new Vector3(p.x, 0, p.y));
    const mesh = ExtrudePolygon(
      building.id,
      { shape, depth: heightM, sideOrientation: Mesh.DOUBLESIDE },
      scene,
      earcut,
    );
    mesh.position.y = -mesh.getBoundingInfo().boundingBox.minimum.y;
    return mesh;
  } catch {
    return boxFromRing(scene, building.id, ring, heightM);
  }
};

export const buildBuildings = (
  scene: Scene,
  materials: BlockoutMaterials,
  buildings: readonly BuildingData[],
): number => {
  const groups = new Map<string, Mesh[]>();
  let count = 0;
  for (const building of buildings) {
    const mesh = extrude(scene, building);
    if (!mesh) continue;
    pushToGroup(groups, PALETTE[stringHash(building.id) % PALETTE.length] ?? '#cccccc', mesh);
    count++;
  }
  materials.mergeByColour(groups, 'buildings');
  return count;
};
