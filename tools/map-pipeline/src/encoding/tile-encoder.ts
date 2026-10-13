/**
 * Role: encodes one cut tile into its three files (geom.glb, collision.bin, meta.json), validated by @skyline/tile-format, with content hashes and triangle count.
 * Owner: backend
 */

import { createHash } from 'node:crypto';
import { type CollisionData, encodeCollision, parseTileMeta, type TileMeta } from '@skyline/tile-format';
import { extrudeBuilding } from '../meshing/extrude-building.ts';
import { MeshBuffer } from '../meshing/mesh-buffer.ts';
import { addGroundQuad, addRoadRibbon } from '../meshing/road-ribbon.ts';
import { isPathClass } from '../roads/road-classes.ts';
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
  readonly triangles: number;
  readonly drawCalls: number;
}

export const hash16 = (bytes: Uint8Array): string => createHash('sha256').update(bytes).digest('hex').slice(0, 16);
const file = (bytes: Uint8Array): EncodedFile => ({ hash: hash16(bytes), bytes });

const meshGroups = (tile: TileContent): MeshGroups => {
  const groups = {
    ground: new MeshBuffer(),
    road: new MeshBuffer(),
    path: new MeshBuffer(),
    walls: new MeshBuffer(),
    roofs: new MeshBuffer(),
  };
  addGroundQuad(groups.ground, TILE_SIZE_M);
  for (const road of tile.roads)
    for (const line of road.lines)
      addRoadRibbon(isPathClass(road.roadClass) ? groups.path : groups.road, line, road.roadClass);
  for (const part of tile.buildingParts) extrudeBuilding(part.polygons, part.heightM, groups.walls, groups.roofs);
  return groups;
};

const flatRing = (ring: readonly LocalPoint[]): Float32Array => {
  const open =
    ring.length > 1 && ring[0]?.[0] === ring.at(-1)?.[0] && ring[0]?.[1] === ring.at(-1)?.[1]
      ? ring.slice(0, -1)
      : ring;
  return Float32Array.from(open.flat());
};

/** v0: flat ground (no DEM yet) and one prism per building polygon (outer ring; courtyards are filled). */
const collisionOf = (tile: TileContent): CollisionData => ({
  heightField: { resolution: 2, cellSizeM: TILE_SIZE_M, heightsM: new Float32Array(4) },
  prisms: tile.buildingParts.flatMap((part) =>
    part.polygons
      .map((polygon) => flatRing(polygon[0] ?? []))
      .filter((ring) => ring.length >= 6)
      .map((ring) => ({ baseYM: 0, topYM: part.heightM, ring })),
  ),
});

const metaOf = (tile: TileContent, existing: ReadonlySet<string>): TileMeta =>
  parseTileMeta({
    formatVersion: 0,
    tileKey: tile.key,
    buildings: tile.buildingMeta.map((b) => ({
      id: b.id,
      type: b.type,
      levels: b.levels,
      heightM: b.heightM,
      heightSource: b.heightSource,
    })),
    // displayName is produced by the naming stage (ADR 0010, J2); null until then.
    places: tile.places.map((p) => ({
      id: p.id,
      category: p.category,
      displayName: null,
      position: { x: p.position[0], z: p.position[1] },
      buildingId: p.buildingId,
    })),
    neighbours: neighbourKeys(tile.key).filter((k) => existing.has(k)),
  });

export const encodeTile = async (tile: TileContent, existing: ReadonlySet<string>): Promise<EncodedTile> => {
  const groups = meshGroups(tile);
  const triangles = Object.values(groups).reduce((sum, g) => sum + g.triangleCount, 0);
  const drawCalls = Object.values(groups).filter((g) => g.triangleCount > 0).length;
  return {
    key: tile.key,
    geom: file(await buildTileGlb(groups, tile.key)),
    collision: file(encodeCollision(collisionOf(tile))),
    meta: file(new TextEncoder().encode(`${JSON.stringify(metaOf(tile, existing))}\n`)),
    triangles,
    drawCalls,
  };
};
