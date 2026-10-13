/**
 * Role: converts a GeoJSON FeatureCollection (golden fixture) into GeoJSONSeq — one feature per line, like osmium export.
 * Owner: backend
 */

interface FeatureCollectionLike {
  type: 'FeatureCollection';
  features: unknown[];
}

const isFeatureCollection = (value: unknown): value is FeatureCollectionLike =>
  typeof value === 'object' &&
  value !== null &&
  (value as { type?: unknown }).type === 'FeatureCollection' &&
  Array.isArray((value as { features?: unknown }).features);

export const featureCollectionToSeq = (json: string): string => {
  const parsed: unknown = JSON.parse(json);
  if (!isFeatureCollection(parsed)) throw new Error('expected a GeoJSON FeatureCollection');
  return parsed.features.map((feature) => `${JSON.stringify(feature)}\n`).join('');
};
