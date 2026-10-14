/**
 * Role: encodes one cut tile into its three files (geom.glb, collision.bin, meta.json), validated by @skyline/tile-format, with content hashes and triangle count.
 * Owner: backend
 */

import { createHash } from 'node:crypto';
import { type CollisionData, encodeCollision, encodeInstances, type Instance, parseTileMeta, TILE_FORMAT_VERSION, type TileMeta, type WaterLayer } from '@skyline/tile-format';
import { extrudeBuilding } from '../meshing/extrude-building.ts';
import { MeshBuffer } from '../meshing/mesh-buffer.ts';
import { addGroundQuad, addRoadRibbon } from '../meshing/road-ribbon.ts';
import { addTerrainGrid, addWaterCells, isWaterCell } from '../meshing/terrain-mesh.ts';
import { isPathClass } from '../roads/road-classes.ts';
import type { TileTerrain } from '../terrain/tile-terrain.ts';
import type { LocalPoint, TileContent } from '../tiling/tile-content.ts';
import { neighbourKeys, TILE_SIZE_M } from '../tiling/tile-frame.ts';
import { buildTileGlb, type MeshGroups } from './tile-glb.ts';

export interface EncodedFile {
  readonly hash: string;
  readonly bytes: Uint8Array;
}

export interface EncodedTile {
  readonly key: string;
  readonly geom: EncodedFile;
  readonly collision: EncodedFile;
  readonly meta: EncodedFile;
  /** Props / vegetation; absent when the tile has none. */
  readonly instances: EncodedFile | null;
  readonly instanceCount: number;
  readonly triangles: number;
  readonly drawCalls: number;
}

export const hash16 = (bytes: Uint8Array): string => createHash('sha256').update(bytes).digest('hex').slice(0, 16);
const file = (bytes: Uint8Array): EncodedFile => ({ hash: hash16(bytes), bytes });

/** Bilinear terrain height in tile-local metres (flat 0 without terrain). */
const groundSampler =
  (t: TileTerrain | null) =>
  (x: number, z: number): number => {
    if (!t) return 0;
    const fx = Math.max(0, Math.min(x / t.cellSizeM, t.resolution - 1.000001));
    const fz = Math.max(0, Math.min(z / t.cellSizeM, t.resolution - 1.000001));
    const i = Math.floor(fx);
    const j = Math.floor(fz);
    const h = (ii: number, jj: number): number => t.heightsM[jj * t.resolution + ii] ?? 0;
    const tx = fx - i;
    const tz = fz - j;
    return (h(i, j) * (1 - tx) + h(i + 1, j) * tx) * (1 - tz) + (h(i, j + 1) * (1 - tx) + h(i + 1, j + 1) * tx) * tz;
  };

export interface EncodeOptions {
  /** Leave the walls covered by facade bays out of geom.glb (once the client renders the facade kit). */
  readonly stripFacadeWalls?: boolean;
}

export const meshGroups = (tile: TileContent, { stripFacadeWalls = false }: EncodeOptions = {}): MeshGroups => {
  const groups = { ground: new MeshBuffer(), water: new MeshBuffer(), road: new MeshBuffer(), path: new MeshBuffer(), walls: new MeshBuffer(), roofs: new MeshBuffer(), sheetRoofs: new MeshBuffer() };
  if (tile.terrain) {
    addTerrainGrid(groups.ground, tile.terrain);
    addWaterCells(groups.water, tile.terrain);
  } else {
    addGroundQuad(groups.ground, TILE_SIZE_M);
  }
  const groundAt = groundSampler(tile.terrain);
  for (const road of tile.roads) for (const line of road.lines) addRoadRibbon(isPathClass(road.roadClass) ? groups.path : groups.road, line, road.roadClass, groundAt);
  for (const part of tile.buildingParts) extrudeBuilding(part, groups, stripFacadeWalls);
  return groups;
};

const flatRing = (ring: readonly LocalPoint[]): Float32Array => {
  const open =
    ring.length > 1 && ring[0]?.[0] === ring.at(-1)?.[0] && ring[0]?.[1] === ring.at(-1)?.[1]
      ? ring.slice(0, -1)
      : ring;
  return Float32Array.from(open.flat());
};

const waterLayerOf = (t: TileTerrain | null): WaterLayer | null =>
  t?.water ? { levelM: t.water.levelM, cellsPerSide: t.water.cellsPerSide, mask: new Uint8Array(Buffer.from(t.water.maskBase64, 'base64')) } : null;

/** Relief height field, one prism per building polygon (outer ring; courtyards filled), water cells. */
const collisionOf = (tile: TileContent): CollisionData => ({
  heightField: tile.terrain
    ? { resolution: tile.terrain.resolution, cellSizeM: tile.terrain.cellSizeM, heightsM: Float32Array.from(tile.terrain.heightsM) }
    : { resolution: 2, cellSizeM: TILE_SIZE_M, heightsM: new Float32Array(4) },
  prisms: tile.buildingParts.flatMap((part) =>
    part.polygons
      .map((polygon) => flatRing(polygon[0] ?? []))
      .filter((ring) => ring.length >= 6)
      .map((ring) => ({ baseYM: part.baseYM, topYM: part.baseYM + part.heightM, ring })),
  ),
  water: waterLayerOf(tile.terrain),
});

const metaOf = (tile: TileContent, existing: ReadonlySet<string>): TileMeta =>
  parseTileMeta({
    formatVersion: TILE_FORMAT_VERSION,
    tileKey: tile.key,
    buildings: tile.buildingMeta.map((b) => ({ id: b.id, type: b.type, levels: b.levels, heightM: b.heightM, heightSource: b.heightSource })),
    places: tile.places.map((p) => ({
      id: p.id,
      category: p.category,
      displayName: p.displayName,
      position: { x: p.position[0], z: p.position[1] },
      buildingId: p.buildingId,
      ...(p.placeType ? { placeType: p.placeType } : {}),
      ...(p.sites ? { sites: p.sites.map((s) => ({ kind: s.kind, capacity: s.capacity, position: { x: s.position[0], z: s.position[1] }, yawRad: s.yawRad })) } : {}),
    })),
    neighbours: neighbourKeys(tile.key).filter((k) => existing.has(k)),
  });

/** Instances keep their own height (facades) or stand on the terrain; terrain instances on water cells are dropped. */
const instancesOf = (tile: TileContent): Instance[] => {
  const groundAt = groundSampler(tile.terrain);
  const water = tile.terrain?.water;
  const mask = water ? new Uint8Array(Buffer.from(water.maskBase64, 'base64')) : null;
  const cell = water ? TILE_SIZE_M / water.cellsPerSide : 1;
  const onWater = (x: number, z: number): boolean =>
    !!mask && !!water && isWaterCell(mask, water.cellsPerSide, Math.min(water.cellsPerSide - 1, Math.floor(x / cell)), Math.min(water.cellsPerSide - 1, Math.floor(z / cell)));
  return tile.instances
    .filter(({ position: [x, z], yM }) => yM !== undefined || !onWater(x, z))
    .map(({ module, position: [x, z], yM, yawRad, scale, variant, stretchX, stretchY }) => ({
      module,
      x,
      y: yM ?? groundAt(x, z),
      z,
      yawRad,
      scale,
      variant,
      ...(stretchX === undefined ? {} : { stretchX }),
      ...(stretchY === undefined ? {} : { stretchY }),
    }));
};

export const encodeTile = async (tile: TileContent, existing: ReadonlySet<string>, options: EncodeOptions = {}): Promise<EncodedTile> => {
  const groups = meshGroups(tile, options);
  const triangles = Object.values(groups).reduce((sum, g) => sum + g.triangleCount, 0);
  const instances = instancesOf(tile);
  // One draw call per non-empty material group and per instanced module (thin instances).
  const drawCalls = Object.values(groups).filter((g) => g.triangleCount > 0).length + new Set(instances.map((i) => i.module)).size;
  return {
    key: tile.key,
    geom: file(await buildTileGlb(groups, tile.key)),
    collision: file(encodeCollision(collisionOf(tile))),
    meta: file(new TextEncoder().encode(`${JSON.stringify(metaOf(tile, existing))}\n`)),
    instances: instances.length > 0 ? file(encodeInstances(instances)) : null,
    instanceCount: instances.length,
    triangles,
    drawCalls,
  };
};

export interface EncodedLodTile {
  readonly key: string;
  readonly geom: EncodedFile;
  readonly triangles: number;
  readonly drawCalls: number;
}

/** Render-only tile of a coarser level (L1+): geometry only. */
export const encodeLodTile = async (tile: TileContent): Promise<EncodedLodTile> => {
  const groups = meshGroups(tile);
  return {
    key: tile.key,
    geom: file(await buildTileGlb(groups, tile.key)),
    triangles: Object.values(groups).reduce((sum, g) => sum + g.triangleCount, 0),
    drawCalls: Object.values(groups).filter((g) => g.triangleCount > 0).length,
  };
};
