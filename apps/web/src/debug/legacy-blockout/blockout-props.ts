/**
 * Role: draws legacy props (trees, street lights, benches, signs, bins) as thin instances, one draw call per part.
 * Owner: frontend
 */

import '@babylonjs/core/Meshes/thinInstanceMesh';
import { Axis } from '@babylonjs/core/Maths/math.axis';
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import type { Scene } from '@babylonjs/core/scene';
import { type BlockoutMaterials, pushToGroup } from './blockout-materials.ts';
import type { PropData } from './blockout-types.ts';

interface PropPart {
  build: (scene: Scene) => Mesh;
  colour: string;
  yM: number;
}

const PROP_PARTS: Record<string, PropPart[]> = {
  tree: [
    { build: (s) => CreateCylinder('p_trunk', { height: 3, diameter: 0.4 }, s), colour: '#6b4a2f', yM: 1.5 },
    { build: (s) => CreateSphere('p_canopy', { diameter: 5, segments: 6 }, s), colour: '#3f7d3a', yM: 5 },
  ],
  street_light: [
    { build: (s) => CreateCylinder('p_pole', { height: 4, diameter: 0.15 }, s), colour: '#555555', yM: 2 },
    { build: (s) => CreateBox('p_head', { width: 0.6, height: 0.2, depth: 0.3 }, s), colour: '#f2e6a0', yM: 4.1 },
  ],
  bench: [{ build: (s) => CreateBox('p_bench', { width: 1.6, height: 0.5, depth: 0.5 }, s), colour: '#8a5a2b', yM: 0.25 }],
  signage: [{ build: (s) => CreateBox('p_sign', { width: 0.1, height: 2, depth: 0.6 }, s), colour: '#c0392b', yM: 1 }],
  trash: [{ build: (s) => CreateCylinder('p_trash', { height: 0.8, diameter: 0.5 }, s), colour: '#2f4f4f', yM: 0.4 }],
};

const instanceMatrices = (props: readonly PropData[]): Float32Array => {
  const buffer = new Float32Array(props.length * 16);
  props.forEach((p, i) => {
    Matrix.Compose(
      new Vector3(p.scale, p.scale, p.scale),
      Quaternion.RotationAxis(Axis.Y, p.rotation),
      new Vector3(p.position.x, 0, p.position.y),
    ).copyToArray(buffer, i * 16);
  });
  return buffer;
};

export const buildProps = (scene: Scene, materials: BlockoutMaterials, props: readonly PropData[]): number => {
  const byType = new Map<string, PropData[]>();
  for (const prop of props) pushToGroup(byType, prop.type, prop);

  let count = 0;
  for (const [type, list] of byType) {
    const parts = PROP_PARTS[type];
    if (!parts) continue;
    const buffer = instanceMatrices(list);
    for (const part of parts) {
      const mesh = part.build(scene);
      mesh.bakeTransformIntoVertices(Matrix.Translation(0, part.yM, 0));
      mesh.material = materials.get(part.colour);
      mesh.thinInstanceSetBuffer('matrix', buffer, 16, true);
      mesh.alwaysSelectAsActiveMesh = true;
    }
    count += list.length;
  }
  return count;
};
