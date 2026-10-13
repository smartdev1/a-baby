/**
 * Role: record types exchanged between stages 04-normalize, 05-classify and 06-heights (UTM metres, stable OSM ids, parsed tags).
 * Owner: backend
 */

import type { HeightSource } from '../heuristics/height-heuristics.ts';
import type { OsmId } from '../osm/osm-id.ts';

/** [easting, northing] in UTM 30N metres, rounded to the centimetre. */
export type UtmPoint = readonly [number, number];
export type UtmRing = readonly UtmPoint[];

export type UtmGeometry =
  | { type: 'Point'; coordinates: UtmPoint }
  | { type: 'LineString'; coordinates: readonly UtmPoint[] }
  | { type: 'MultiLineString'; coordinates: readonly (readonly UtmPoint[])[] }
  /** Areas are always MultiPolygon (Polygon inputs are wrapped). */
  | { type: 'MultiPolygon'; coordinates: readonly (readonly UtmRing[])[] };

export interface NormalizedRecord {
  readonly id: OsmId;
  readonly geometry: UtmGeometry;
  /** Raw OSM tags, trimmed, without export attributes (`@type`, `@id`). */
  readonly tags: Readonly<Record<string, string>>;
  /** Parsed numbers; absent when missing or invalid. */
  readonly levels?: number;
  readonly heightM?: number;
}

export interface ClassifiedRecord extends NormalizedRecord {
  readonly isBuilding: boolean;
  /** Game place category `domain.kind` (e.g. `food.maquis`), areas and points alike. */
  readonly placeCategory: string | null;
  readonly roadClass: string | null;
}

export interface BuildingRecord {
  readonly id: OsmId;
  readonly type: string;
  readonly levels: number;
  readonly heightM: number;
  readonly heightSource: HeightSource;
  readonly footprintAreaM2: number;
  readonly footprint: Extract<UtmGeometry, { type: 'MultiPolygon' }>;
  readonly placeCategory: string | null;
}
