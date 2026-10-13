/**
 * Role: classifies a normalized record: building or not, game place category (points and areas alike), road class.
 * Owner: backend
 */

import type { ClassifiedRecord, NormalizedRecord } from '../records/map-records.ts';
import { DEFAULT_CATEGORY, PLACE_KEYS, PLACE_TAXONOMY, WORSHIP_BY_RELIGION } from './place-taxonomy.ts';

const NOT_A_BUILDING = new Set(['no', 'construction_site']);

export const placeCategoryOf = (tags: Readonly<Record<string, string>>): string | null => {
  for (const key of PLACE_KEYS) {
    const value = tags[key];
    if (value === undefined) continue;
    if (key === 'amenity' && value === 'place_of_worship') return WORSHIP_BY_RELIGION[tags['religion'] ?? ''] ?? 'worship.other';
    const category = PLACE_TAXONOMY[key][value] ?? DEFAULT_CATEGORY[key];
    if (category) return category;
  }
  return null;
};

export const classifyRecord = (record: NormalizedRecord): ClassifiedRecord => {
  const { tags, geometry } = record;
  const isArea = geometry.type === 'MultiPolygon';
  const isLine = geometry.type === 'LineString' || geometry.type === 'MultiLineString';
  const building = tags['building'];
  return {
    ...record,
    isBuilding: isArea && building !== undefined && !NOT_A_BUILDING.has(building),
    placeCategory: placeCategoryOf(tags),
    roadClass: isLine && tags['highway'] !== undefined ? tags['highway'] : null,
  };
};
