/**
 * Role: distributes buildings (with their pitched roofs), roads, places and instances over L0 tiles: geometry cut into every tile it covers, attributes stored once in the tile of the representative point.
 * Owner: backend
 */

import type { BuildingRecord, ClassifiedRecord, UtmGeometry, UtmPoint } from '../records/map-records.ts';
import { moduleIndex } from '@skyline/tile-format';
import type { PitchedRoof } from '../facades/roof-choice.ts';
import type { PlacedInstance } from '../props/placed-instance.ts';
import { TerrainSampler } from '../terrain/terrain-sampler.ts';
import type { TileTerrain } from '../terrain/tile-terrain.ts';
import { clipPolygonsToTile, clipPolylineToTile } from './clip-to-tile.ts';
import { emptyTileContent, type TileContent, type TilePitchedRoof } from './tile-content.ts';
import { boundsOfPoints, tileOfPoint, tileOrigin, tilesOverlapping, toLocal } from './tile-frame.ts';

/** Ways not drawn as roads (not built yet, or not walkable surfaces). */
const SKIPPED_ROAD_CLASSES = new Set(['construction', 'proposed', 'abandoned', 'razed', 'corridor', 'elevator', 'platform', 'raceway']);

/** Vertex average of the outer ring (without its closing point) or of the line / point. */
export const representativePoint = (g: UtmGeometry): UtmPoint => {
  if (g.type === 'Point') return g.coordinates;
  const pts = g.type === 'MultiPolygon' ? (g.coordinates[0]?.[0] ?? []).slice(0, -1) : g.type === 'LineString' ? g.coordinates : g.coordinates.flat();
  const n = Math.max(pts.length, 1);
  return [pts.reduce((s, p) => s + p[0], 0) / n, pts.reduce((s, p) => s + p[1], 0) / n];
};

const linesOf = (g: UtmGeometry): readonly (readonly UtmPoint[])[] =>
  g.type === 'LineString' ? [g.coordinates] : g.type === 'MultiLineString' ? g.coordinates : [];

const localRoof = (roof: PitchedRoof, key: string): TilePitchedRoof => {
  const origin = tileOrigin(key);
  const [a, b, c, d] = roof.corners;
  return { kind: roof.kind, riseM: roof.riseM, corners: [toLocal(a, origin), toLocal(b, origin), toLocal(c, origin), toLocal(d, origin)] };
};

export class TileCutter {
  private readonly tiles = new Map<string, TileContent>();

  private readonly ground: TerrainSampler;

  /** Displayed names by place id (stage 09-naming) and terrain by tile key (stage 10-terrain): every terrain tile exists, even without buildings. */
  constructor(
    private readonly displayNames: ReadonlyMap<string, string | null> = new Map(),
    terrain: ReadonlyMap<string, TileTerrain> = new Map(),
  ) {
    this.ground = new TerrainSampler(terrain);
    for (const [key, t] of terrain) this.tile(key).terrain = t;
  }

  private tile(key: string): TileContent {
    let content = this.tiles.get(key);
    if (!content) {
      content = emptyTileContent(key);
      this.tiles.set(key, content);
    }
    return content;
  }

  /** `roof` comes from stage 11 and is only given for buildings lying in one tile. */
  addBuilding(b: BuildingRecord, roof?: PitchedRoof): void {
    const polygons = b.footprint.coordinates;
    const baseYM = this.ground.baseUnder(polygons[0]?.[0] ?? []);
    for (const key of tilesOverlapping(boundsOfPoints(polygons.flat(2)))) {
      const clipped = clipPolygonsToTile(polygons, tileOrigin(key));
      if (clipped.length === 0) continue;
      this.tile(key).buildingParts.push({ id: b.id, baseYM, heightM: b.heightM, polygons: clipped, ...(roof ? { roof: localRoof(roof, key) } : {}) });
    }
    const owner = tileOfPoint(representativePoint(b.footprint));
    if (owner) this.tile(owner).buildingMeta.push({ id: b.id, type: b.type, levels: b.levels, heightM: b.heightM, heightSource: b.heightSource });
  }

  /** Props and vegetation (stage 12) and facades (stage 11), in the tile of their position. */
  addInstance(p: PlacedInstance): void {
    const key = tileOfPoint([p.e, p.n]);
    if (!key) return;
    const { yM, stretchX, stretchY } = p;
    this.tile(key).instances.push({
      module: moduleIndex(p.module),
      position: toLocal([p.e, p.n], tileOrigin(key)),
      yawRad: p.yawRad,
      scale: p.scale,
      variant: p.variant,
      ...(yM === undefined ? {} : { yM }),
      ...(stretchX === undefined ? {} : { stretchX }),
      ...(stretchY === undefined ? {} : { stretchY }),
    });
  }

  /** Roads and places come from the classified records. */
  addClassified(r: ClassifiedRecord): void {
    if (r.roadClass && !SKIPPED_ROAD_CLASSES.has(r.roadClass)) this.addRoad(r, r.roadClass);
    if (r.placeCategory) {
      const point = representativePoint(r.geometry);
      const key = tileOfPoint(point);
      if (key) {
        this.tile(key).places.push({
          id: r.id,
          category: r.placeCategory,
          position: toLocal(point, tileOrigin(key)),
          buildingId: r.isBuilding ? r.id : null,
          displayName: this.displayNames.get(r.id) ?? null,
        });
      }
    }
  }

  private addRoad(r: ClassifiedRecord, roadClass: string): void {
    for (const line of linesOf(r.geometry)) {
      for (const key of tilesOverlapping(boundsOfPoints(line))) {
        const pieces = clipPolylineToTile(line, tileOrigin(key));
        if (pieces.length > 0) this.tile(key).roads.push({ id: r.id, roadClass, lines: pieces });
      }
    }
  }

  /** Tiles sorted by row then column (deterministic output). */
  sortedTiles(): TileContent[] {
    const coord = (key: string): [number, number] => {
      const [, i, j] = key.split('_').map(Number);
      return [j ?? 0, i ?? 0];
    };
    return [...this.tiles.values()].sort((a, b) => {
      const [aj, ai] = coord(a.key);
      const [bj, bi] = coord(b.key);
      return aj - bj || ai - bi;
    });
  }
}
