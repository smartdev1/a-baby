/**
 * Role: builds an L1 tile (500 m, render only) from its 4 L0 children: simplified buildings (no small ones), roads without paths, terrain and water on a 10 m grid.
 * Owner: backend
 */

import { childTileKeys, tileBounds } from '@skyline/geo';
import { waterMaskBytes } from '@skyline/tile-format';
import { isWaterCell } from '../meshing/terrain-mesh.ts';
import { isPathClass } from '../roads/road-classes.ts';
import type { TileTerrain } from '../terrain/tile-terrain.ts';
import { emptyTileContent, type LocalPoint, type TileContent } from '../tiling/tile-content.ts';
import { ringAreaM2, simplifyRing } from './simplify-ring.ts';

const MIN_BUILDING_AREA_M2 = 30;
const SIMPLIFY_TOLERANCE_M = 1.5;
const L1_RESOLUTION = 51;
const L1_CELL_M = 10;

const shift = (p: LocalPoint, dx: number, dz: number): LocalPoint => [Math.round((p[0] + dx) * 100) / 100, Math.round((p[1] + dz) * 100) / 100];

/** Height of the L1 vertex (i, j) read from the child L0 grid that contains it. */
const l1Terrain = (key: string, children: ReadonlyMap<string, TileContent>, offsets: ReadonlyMap<string, [number, number]>): TileTerrain => {
  const heightAt = (x: number, z: number): number => {
    for (const [childKey, child] of children) {
      const [ox, oz] = offsets.get(childKey) ?? [0, 0];
      const t = child.terrain;
      if (!t || x < ox || z < oz || x > ox + 250 || z > oz + 250) continue;
      const i = Math.round((x - ox) / t.cellSizeM);
      const j = Math.round((z - oz) / t.cellSizeM);
      return t.heightsM[j * t.resolution + i] ?? 0;
    }
    return 0;
  };
  const heightsM: number[] = [];
  for (let j = 0; j < L1_RESOLUTION; j++) for (let i = 0; i < L1_RESOLUTION; i++) heightsM.push(heightAt(i * L1_CELL_M, j * L1_CELL_M));
  return { key, resolution: L1_RESOLUTION, cellSizeM: L1_CELL_M, heightsM, water: l1Water(children, offsets) };
};

/** A 10 m L1 cell is water when its 4 child 5 m cells are mostly water (≥ 2 of 4). */
const l1Water = (children: ReadonlyMap<string, TileContent>, offsets: ReadonlyMap<string, [number, number]>): TileTerrain['water'] => {
  const cells = L1_RESOLUTION - 1;
  const mask = new Uint8Array(waterMaskBytes(cells));
  let any = false;
  let level = Infinity;
  for (const [childKey, child] of children) {
    const w = child.terrain?.water;
    if (!w) continue;
    level = Math.min(level, w.levelM);
    const childMask = new Uint8Array(Buffer.from(w.maskBase64, 'base64'));
    const [ox, oz] = offsets.get(childKey) ?? [0, 0];
    for (let j = 0; j < w.cellsPerSide / 2; j++) {
      for (let i = 0; i < w.cellsPerSide / 2; i++) {
        const votes = [0, 1].flatMap((dj) => [0, 1].map((di) => isWaterCell(childMask, w.cellsPerSide, 2 * i + di, 2 * j + dj))).filter(Boolean).length;
        if (votes < 2) continue;
        const k = (oz / L1_CELL_M + j) * cells + ox / L1_CELL_M + i;
        mask[k >> 3] = (mask[k >> 3] ?? 0) | (1 << (k & 7));
        any = true;
      }
    }
  }
  return any ? { levelM: level, cellsPerSide: cells, maskBase64: Buffer.from(mask).toString('base64') } : null;
};

export const buildL1Tile = (key: string, l0: ReadonlyMap<string, TileContent>): TileContent => {
  const origin = tileBounds(key);
  const out = emptyTileContent(key);
  const offsets = new Map<string, [number, number]>();
  const children = new Map<string, TileContent>();
  for (const childKey of childTileKeys(key)) {
    const child = l0.get(childKey);
    if (!child) continue;
    const b = tileBounds(childKey);
    const [dx, dz] = [b.minEastingM - origin.minEastingM, b.minNorthingM - origin.minNorthingM];
    offsets.set(childKey, [dx, dz]);
    children.set(childKey, child);
    for (const part of child.buildingParts) {
      const polygons = part.polygons
        .map((rings) => rings.map((ring) => simplifyRing(ring.map((p) => shift(p, dx, dz)), SIMPLIFY_TOLERANCE_M)).filter((r): r is LocalPoint[] => r !== null))
        .filter((rings) => rings.length > 0 && ringAreaM2(rings[0] ?? []) >= MIN_BUILDING_AREA_M2);
      if (polygons.length > 0) out.buildingParts.push({ ...part, polygons });
    }
    for (const road of child.roads) {
      if (!isPathClass(road.roadClass)) out.roads.push({ ...road, lines: road.lines.map((line) => line.map((p) => shift(p, dx, dz))) });
    }
  }
  out.terrain = children.size > 0 ? l1Terrain(key, children, offsets) : null;
  return out;
};
