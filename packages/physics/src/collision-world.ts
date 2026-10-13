/**
 * Role: collision world made of decoded tile collisions placed in a common frame: ground height lookup and grid-indexed prism queries.
 * Owner: backend
 */

import type { CollisionData } from '@skyline/tile-format';

export interface WorldPrism {
  readonly baseYM: number;
  readonly topYM: number;
  /** Ring in frame coordinates [x0, z0, …]. */
  readonly ring: Float32Array;
  readonly minX: number;
  readonly minZ: number;
  readonly maxX: number;
  readonly maxZ: number;
}

interface PlacedTile {
  readonly offsetX: number;
  readonly offsetZ: number;
  readonly sizeM: number;
  readonly data: CollisionData;
}

const GRID_M = 16;
const key = (gx: number, gz: number): string => `${gx}:${gz}`;

export class CollisionWorld {
  private readonly tiles: PlacedTile[] = [];
  private readonly grid = new Map<string, WorldPrism[]>();

  /** Adds a tile whose south-west corner is at (offsetX, offsetZ) in the frame. */
  addTile(data: CollisionData, offsetX: number, offsetZ: number): void {
    const { resolution, cellSizeM } = data.heightField;
    this.tiles.push({ offsetX, offsetZ, sizeM: (resolution - 1) * cellSizeM, data });
    for (const p of data.prisms) {
      const ring = p.ring.map((v, k) => v + (k % 2 === 0 ? offsetX : offsetZ));
      const xs = ring.filter((_, k) => k % 2 === 0);
      const zs = ring.filter((_, k) => k % 2 === 1);
      const prism: WorldPrism = { baseYM: p.baseYM, topYM: p.topYM, ring, minX: Math.min(...xs), minZ: Math.min(...zs), maxX: Math.max(...xs), maxZ: Math.max(...zs) };
      for (let gx = Math.floor(prism.minX / GRID_M); gx <= Math.floor(prism.maxX / GRID_M); gx++) {
        for (let gz = Math.floor(prism.minZ / GRID_M); gz <= Math.floor(prism.maxZ / GRID_M); gz++) {
          const bucket = this.grid.get(key(gx, gz)) ?? [];
          bucket.push(prism);
          this.grid.set(key(gx, gz), bucket);
        }
      }
    }
  }

  /** Bilinear ground height; 0 outside loaded tiles. */
  groundHeightAt(x: number, z: number): number {
    const tile = this.tiles.find((t) => x >= t.offsetX && x <= t.offsetX + t.sizeM && z >= t.offsetZ && z <= t.offsetZ + t.sizeM);
    if (!tile) return 0;
    const { resolution, cellSizeM, heightsM } = tile.data.heightField;
    const fx = Math.min((x - tile.offsetX) / cellSizeM, resolution - 1.000001);
    const fz = Math.min((z - tile.offsetZ) / cellSizeM, resolution - 1.000001);
    const ix = Math.floor(fx);
    const iz = Math.floor(fz);
    const tx = fx - ix;
    const tz = fz - iz;
    const h = (i: number, j: number): number => heightsM[j * resolution + i] ?? 0;
    return (h(ix, iz) * (1 - tx) + h(ix + 1, iz) * tx) * (1 - tz) + (h(ix, iz + 1) * (1 - tx) + h(ix + 1, iz + 1) * tx) * tz;
  }

  /** Prisms whose bounding box intersects the square of half-size `radius` around (x, z), without duplicates. */
  prismsNear(x: number, z: number, radius: number): WorldPrism[] {
    const found = new Set<WorldPrism>();
    for (let gx = Math.floor((x - radius) / GRID_M); gx <= Math.floor((x + radius) / GRID_M); gx++) {
      for (let gz = Math.floor((z - radius) / GRID_M); gz <= Math.floor((z + radius) / GRID_M); gz++) {
        for (const p of this.grid.get(key(gx, gz)) ?? []) {
          if (p.maxX >= x - radius && p.minX <= x + radius && p.maxZ >= z - radius && p.minZ <= z + radius) found.add(p);
        }
      }
    }
    return [...found];
  }
}
