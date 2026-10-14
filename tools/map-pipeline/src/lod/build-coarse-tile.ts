/**
 * Role: builds an L2 (1 km) or L3 (2 km) render tile from its L0 descendants: terrain and water on a 51 × 51 grid, major roads only, buildings replaced by block impostors.
 * Owner: backend
 */

import { tileBounds } from '@skyline/geo';
import { waterMaskBytes } from '@skyline/tile-format';
import { isWaterCell } from '../meshing/terrain-mesh.ts';
import type { TileTerrain } from '../terrain/tile-terrain.ts';
import { emptyTileContent, type LocalPoint, type TileContent, type TileRoad } from '../tiling/tile-content.ts';
import { blockImpostors, type FramedPart } from './block-impostors.ts';

const RESOLUTION = 51;
const L0_SIZE_M = 250;
/** Roads still drawn at 1–2 km: the network you would see from far away. */
const COARSE_ROAD_CLASSES: Readonly<Record<number, ReadonlySet<string>>> = {
  2: new Set(['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'motorway_link', 'trunk_link', 'primary_link', 'secondary_link']),
  3: new Set(['motorway', 'trunk', 'primary', 'secondary', 'motorway_link', 'trunk_link', 'primary_link']),
};

interface Child {
  readonly tile: TileContent;
  /** Child south-west corner in the coarse tile frame. */
  readonly ox: number;
  readonly oz: number;
}

const childAt = (children: readonly Child[], x: number, z: number): Child | undefined =>
  children.find((c) => x >= c.ox && z >= c.oz && x <= c.ox + L0_SIZE_M && z <= c.oz + L0_SIZE_M);

const heightAt = (children: readonly Child[], x: number, z: number): number => {
  const c = childAt(children, x, z);
  const t = c?.tile.terrain;
  if (!c || !t) return 0;
  const i = Math.min(t.resolution - 1, Math.round((x - c.ox) / t.cellSizeM));
  const j = Math.min(t.resolution - 1, Math.round((z - c.oz) / t.cellSizeM));
  return t.heightsM[j * t.resolution + i] ?? 0;
};

const isWaterAt = (children: readonly Child[], x: number, z: number): { water: boolean; levelM: number } => {
  const c = childAt(children, x, z);
  const w = c?.tile.terrain?.water;
  if (!c || !w) return { water: false, levelM: 0 };
  const cell = L0_SIZE_M / w.cellsPerSide;
  const mask = new Uint8Array(Buffer.from(w.maskBase64, 'base64'));
  const i = Math.min(w.cellsPerSide - 1, Math.floor((x - c.ox) / cell));
  const j = Math.min(w.cellsPerSide - 1, Math.floor((z - c.oz) / cell));
  return { water: isWaterCell(mask, w.cellsPerSide, i, j), levelM: w.levelM };
};

const coarseTerrain = (key: string, sizeM: number, children: readonly Child[]): TileTerrain => {
  const cellM = sizeM / (RESOLUTION - 1);
  const heightsM: number[] = [];
  for (let j = 0; j < RESOLUTION; j++) for (let i = 0; i < RESOLUTION; i++) heightsM.push(heightAt(children, i * cellM, j * cellM));
  const cells = RESOLUTION - 1;
  const mask = new Uint8Array(waterMaskBytes(cells));
  let level = Infinity;
  for (let j = 0; j < cells; j++) {
    for (let i = 0; i < cells; i++) {
      const w = isWaterAt(children, (i + 0.5) * cellM, (j + 0.5) * cellM);
      if (!w.water) continue;
      const k = j * cells + i;
      mask[k >> 3] = (mask[k >> 3] ?? 0) | (1 << (k & 7));
      level = Math.min(level, w.levelM);
    }
  }
  const water = Number.isFinite(level) ? { levelM: level, cellsPerSide: cells, maskBase64: Buffer.from(mask).toString('base64') } : null;
  return { key, resolution: RESOLUTION, cellSizeM: cellM, heightsM, water };
};

const shift = ([x, z]: LocalPoint, c: Child): LocalPoint => [Math.round((x + c.ox) * 100) / 100, Math.round((z + c.oz) * 100) / 100];

export const buildCoarseTile = (key: string, level: 2 | 3, descendants: ReadonlyMap<string, TileContent>): TileContent => {
  const origin = tileBounds(key);
  const sizeM = origin.maxEastingM - origin.minEastingM;
  const children: Child[] = [...descendants].map(([childKey, tile]) => {
    const b = tileBounds(childKey);
    return { tile, ox: b.minEastingM - origin.minEastingM, oz: b.minNorthingM - origin.minNorthingM };
  });
  const out = emptyTileContent(key);
  out.terrain = coarseTerrain(key, sizeM, children);
  const roadClasses = COARSE_ROAD_CLASSES[level] ?? new Set<string>();
  const parts: FramedPart[] = [];
  for (const c of children) {
    for (const road of c.tile.roads) {
      if (roadClasses.has(road.roadClass)) out.roads.push({ ...road, lines: road.lines.map((line) => line.map((p) => shift(p, c))) } satisfies TileRoad);
    }
    for (const part of c.tile.buildingParts) parts.push({ rings: part.polygons.map((p) => (p[0] ?? []).map((pt) => shift(pt, c))), topYM: part.baseYM + part.heightM });
  }
  const terrain = out.terrain;
  const groundAt = (x: number, z: number): number => {
    const i = Math.min(RESOLUTION - 1, Math.round(x / terrain.cellSizeM));
    const j = Math.min(RESOLUTION - 1, Math.round(z / terrain.cellSizeM));
    return terrain.heightsM[j * RESOLUTION + i] ?? 0;
  };
  out.buildingParts.push(...blockImpostors(parts, { sizeM, cellM: level === 2 ? 20 : 40 }, groundAt));
  return out;
};
