/**
 * Role: tells what an OSM feature is for the coverage report (building, road class, POI category) from its tags.
 * Owner: backend
 */

import type { OsmFeature } from './feature-stream.ts';

/** POI keys counted by the report, in display order. */
export const POI_KEYS = ['amenity', 'shop', 'craft', 'office', 'healthcare', 'tourism', 'leisure', 'public_transport'] as const;
export type PoiKey = (typeof POI_KEYS)[number];

const tag = (f: OsmFeature, key: string): string | undefined => {
  const value = f.properties[key];
  return value === undefined ? undefined : String(value);
};

export const isBuilding = (f: OsmFeature): boolean =>
  tag(f, 'building') !== undefined && tag(f, 'building') !== 'no' && (f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon');

export const buildingType = (f: OsmFeature): string => tag(f, 'building') ?? 'unknown';

export const hasHeight = (f: OsmFeature): boolean => tag(f, 'height') !== undefined;
export const hasLevels = (f: OsmFeature): boolean => tag(f, 'building:levels') !== undefined;

/** `highway` value of a linear way, or null. */
export const roadClass = (f: OsmFeature): string | null => {
  const highway = tag(f, 'highway');
  const linear = f.geometry?.type === 'LineString' || f.geometry?.type === 'MultiLineString';
  return highway && linear ? highway : null;
};

/** First POI key/value of the feature (`amenity=restaurant`), or null. */
export const poiCategory = (f: OsmFeature): { key: PoiKey; value: string } | null => {
  for (const key of POI_KEYS) {
    const value = tag(f, key);
    if (value !== undefined) return { key, value };
  }
  return null;
};

export const hasName = (f: OsmFeature): boolean => tag(f, 'name') !== undefined;
