/**
 * Role: content of one L0 tile after the cut (tiles.ndjson line): clipped building parts, clipped road lines and places, all in metres local to the tile south-west corner.
 * Owner: backend
 */

import type { HeightSource } from '../heuristics/height-heuristics.ts';
import type { OsmId } from '../osm/osm-id.ts';

/** [x = east, z = north] in metres from the tile south-west corner, cm precision. */
export type LocalPoint = readonly [number, number];
/** Outer ring first, then holes; rings are closed (last point = first point). */
export type LocalPolygon = readonly (readonly LocalPoint[])[];

export interface TileBuildingPart {
  readonly id: OsmId;
  readonly heightM: number;
  readonly polygons: readonly LocalPolygon[];
}

/** Building attributes, stored only in the tile that holds the building's representative point. */
export interface TileBuildingMeta {
  readonly id: OsmId;
  readonly type: string;
  readonly levels: number;
  readonly heightM: number;
  readonly heightSource: HeightSource;
}

export interface TileRoad {
  readonly id: OsmId;
  readonly roadClass: string;
  readonly lines: readonly (readonly LocalPoint[])[];
}

export interface TilePlaceEntry {
  readonly id: OsmId;
  readonly category: string;
  readonly position: LocalPoint;
  readonly buildingId: OsmId | null;
}

export interface TileContent {
  readonly key: string;
  readonly buildingParts: TileBuildingPart[];
  readonly buildingMeta: TileBuildingMeta[];
  readonly roads: TileRoad[];
  readonly places: TilePlaceEntry[];
}

export const emptyTileContent = (key: string): TileContent => ({ key, buildingParts: [], buildingMeta: [], roads: [], places: [] });
