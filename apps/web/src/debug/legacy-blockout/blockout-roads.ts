/**
 * Role: builds legacy road ribbons from prototype polylines, merged by surface colour.
 * Owner: frontend
 */

import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { CreateRibbon } from '@babylonjs/core/Meshes/Builders/ribbonBuilder';
import type { Scene } from '@babylonjs/core/scene';
import { type BlockoutMaterials, pushToGroup } from './blockout-materials.ts';
import type { RoadData } from './blockout-types.ts';
import { dedupePoints, distance } from './polyline.ts';

const roadStyle = (road: RoadData): { colour: string; y: number } => {
  if (road.roadType === 'footway' || road.roadType === 'path') return { colour: '#c8bfae', y: 0.06 };
  if (road.roadType === 'service') return { colour: '#6f6f6f', y: 0.05 };
  if (road.surface === 'unpaved') return { colour: '#a8855f', y: 0.04 };
  return { colour: '#4a4a4d', y: 0.04 };
};

const ribbonEdges = (road: RoadData, y: number): [Vector3[], Vector3[]] => {
  const points = dedupePoints(road.path);
  const half = road.width / 2;
  const left: Vector3[] = [];
  const right: Vector3[] = [];
  points.forEach((p, i) => {
    const prev = points[Math.max(i - 1, 0)] ?? p;
    const next = points[Math.min(i + 1, points.length - 1)] ?? p;
    const length = distance(prev, next);
    if (length === 0) return;
    const nx = -(next.y - prev.y) / length;
    const ny = (next.x - prev.x) / length;
    left.push(new Vector3(p.x + nx * half, y, p.y + ny * half));
    right.push(new Vector3(p.x - nx * half, y, p.y - ny * half));
  });
  return [left, right];
};

export const buildRoads = (scene: Scene, materials: BlockoutMaterials, roads: readonly RoadData[]): number => {
  const groups = new Map<string, Mesh[]>();
  for (const road of roads) {
    const { colour, y } = roadStyle(road);
    const [left, right] = ribbonEdges(road, y);
    if (left.length < 2) continue;
    const ribbon = CreateRibbon(road.id, { pathArray: [left, right], sideOrientation: Mesh.DOUBLESIDE }, scene);
    pushToGroup(groups, colour, ribbon);
  }
  materials.mergeByColour(groups, 'roads');
  return [...groups.values()].reduce((sum, list) => sum + list.length, 0);
};
