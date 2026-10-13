/**
 * Role: assembles the legacy blockout scene (ground, roads, buildings, props) and returns its centre and stats.
 * Owner: frontend
 */

import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';
import type { Scene } from '@babylonjs/core/scene';
import { buildBuildings } from './blockout-buildings.ts';
import { BlockoutMaterials } from './blockout-materials.ts';
import { buildProps } from './blockout-props.ts';
import { buildRoads } from './blockout-roads.ts';
import type { BuildingData, PropData, WorldData } from './blockout-types.ts';

/** The prototype squeezed the area into 300 units (known 0.25 scale bug, fixed by the tile pipeline). */
const LEGACY_WORLD_SIZE = 300;

export interface BlockoutResult {
  center: Vector3;
  stats: { buildings: number; roads: number; props: number };
}

const centerOf = (buildings: readonly BuildingData[]): Vector3 => {
  const firsts = buildings.map((b) => b.footprint[0]?.[0]).filter((p) => p !== undefined);
  if (firsts.length === 0) return new Vector3(LEGACY_WORLD_SIZE / 2, 0, LEGACY_WORLD_SIZE / 2);
  const sum = firsts.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return new Vector3(sum.x / firsts.length, 0, sum.y / firsts.length);
};

export const renderBlockout = (scene: Scene, world: WorldData, props: readonly PropData[]): BlockoutResult => {
  const materials = new BlockoutMaterials(scene);
  const ground = CreateGround('ground', { width: LEGACY_WORLD_SIZE, height: LEGACY_WORLD_SIZE }, scene);
  ground.position.set(LEGACY_WORLD_SIZE / 2, 0, LEGACY_WORLD_SIZE / 2);
  ground.material = materials.get('#7d8a63');
  ground.freezeWorldMatrix();

  return {
    center: centerOf(world.buildings),
    stats: {
      roads: buildRoads(scene, materials, world.roads),
      buildings: buildBuildings(scene, materials, world.buildings),
      props: buildProps(scene, materials, props),
    },
  };
};
