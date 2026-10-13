/**
 * Role: flat-colour material cache and merge-by-colour helper shared by the legacy blockout builders.
 * Owner: frontend
 */

import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { Scene } from '@babylonjs/core/scene';

export class BlockoutMaterials {
  private readonly cache = new Map<string, StandardMaterial>();

  constructor(private readonly scene: Scene) {}

  get(hex: string): StandardMaterial {
    let material = this.cache.get(hex);
    if (!material) {
      material = new StandardMaterial(`blockout_${hex}`, this.scene);
      material.diffuseColor = Color3.FromHexString(hex);
      material.specularColor = Color3.Black();
      this.cache.set(hex, material);
    }
    return material;
  }

  /** Merges meshes sharing a colour into one draw call each. */
  mergeByColour(groups: Map<string, Mesh[]>, label: string): void {
    for (const [hex, meshes] of groups) {
      const merged = Mesh.MergeMeshes(meshes, true, true);
      if (!merged) continue;
      merged.name = `${label}_${hex}`;
      merged.material = this.get(hex);
      merged.freezeWorldMatrix();
    }
  }
}

export const pushToGroup = <K, V>(map: Map<K, V[]>, key: K, value: V): void => {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
};
