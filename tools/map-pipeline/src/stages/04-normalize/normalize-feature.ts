/**
 * Role: turns one exported GeoJSON feature into a NormalizedRecord: stable OSM id, UTM metres rounded to the centimetre, areas as MultiPolygon, trimmed tags, parsed levels and height.
 * Owner: backend
 */

import { toUtm30n } from '@skyline/geo';
import type { Geometry, Position } from '../../geometry/geojson-geometry.ts';
import { stableOsmId } from '../../osm/osm-id.ts';
import { parseHeightM, parseLevels } from '../../osm/parse-osm-numbers.ts';
import type { NormalizedRecord, UtmGeometry, UtmPoint } from '../../records/map-records.ts';

export interface ExportedFeature {
  readonly id?: unknown;
  readonly geometry: Geometry | null;
  readonly properties: Record<string, unknown>;
}

const toCm = (value: number): number => Math.round(value * 100) / 100;

const toUtmPoint = (p: Position): UtmPoint => {
  const { eastingM, northingM } = toUtm30n({ lonDeg: p[0], latDeg: p[1] });
  return [toCm(eastingM), toCm(northingM)];
};

const toUtmGeometry = (g: Geometry): UtmGeometry => {
  switch (g.type) {
    case 'Point':
      return { type: 'Point', coordinates: toUtmPoint(g.coordinates) };
    case 'LineString':
      return { type: 'LineString', coordinates: g.coordinates.map(toUtmPoint) };
    case 'MultiLineString':
      return { type: 'MultiLineString', coordinates: g.coordinates.map((line) => line.map(toUtmPoint)) };
    case 'Polygon':
      return { type: 'MultiPolygon', coordinates: [g.coordinates.map((ring) => ring.map(toUtmPoint))] };
    case 'MultiPolygon':
      return { type: 'MultiPolygon', coordinates: g.coordinates.map((poly) => poly.map((ring) => ring.map(toUtmPoint))) };
  }
};

const cleanTags = (properties: Record<string, unknown>): Record<string, string> => {
  const tags: Record<string, string> = {};
  for (const key of Object.keys(properties).sort()) {
    const value = properties[key];
    if (key.startsWith('@')) continue;
    if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') continue;
    const text = String(value).trim();
    if (text !== '') tags[key] = text;
  }
  return tags;
};

const SUPPORTED = new Set(['Point', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon']);

/** Returns null for features without OSM identity or with an unsupported / empty geometry. */
export const normalizeFeature = (feature: ExportedFeature): NormalizedRecord | null => {
  const id = stableOsmId(feature.properties, feature.id);
  if (!id || !feature.geometry || !SUPPORTED.has(feature.geometry.type)) return null;
  const tags = cleanTags(feature.properties);
  const levels = parseLevels(tags['building:levels']);
  const heightM = parseHeightM(tags['height']);
  return {
    id,
    geometry: toUtmGeometry(feature.geometry),
    tags,
    ...(levels === undefined ? {} : { levels }),
    ...(heightM === undefined ? {} : { heightM }),
  };
};
