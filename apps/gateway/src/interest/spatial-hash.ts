/**
 * Role: spatial hash of the entities of one cell snapshot (32 m meshes on the ground plane, ARCHITECTURE §13.3), built once per snapshot and queried by radius for every viewer.
 * Owner: backend
 */

import type { EntityState } from '@skyline/protocol';

export const MESH_M = 32;

const keyOf = (i: number, j: number): string => `${i}:${j}`;

export class SpatialHash {
  private readonly meshes = new Map<string, EntityState[]>();

  constructor(entities: readonly EntityState[]) {
    for (const e of entities) {
      const key = keyOf(Math.floor(e.position.x / MESH_M), Math.floor(e.position.z / MESH_M));
      const mesh = this.meshes.get(key);
      if (mesh) mesh.push(e);
      else this.meshes.set(key, [e]);
    }
  }

  /** Entities within `radiusM` of (x, z) on the ground plane, with their squared distance. */
  within(x: number, z: number, radiusM: number): { entity: EntityState; d2: number }[] {
    const out: { entity: EntityState; d2: number }[] = [];
    const r2 = radiusM * radiusM;
    const [i0, i1] = [Math.floor((x - radiusM) / MESH_M), Math.floor((x + radiusM) / MESH_M)];
    const [j0, j1] = [Math.floor((z - radiusM) / MESH_M), Math.floor((z + radiusM) / MESH_M)];
    for (let i = i0; i <= i1; i++) {
      for (let j = j0; j <= j1; j++) {
        for (const entity of this.meshes.get(keyOf(i, j)) ?? []) {
          const d2 = (entity.position.x - x) ** 2 + (entity.position.z - z) ** 2;
          if (d2 <= r2) out.push({ entity, d2 });
        }
      }
    }
    return out;
  }
}
