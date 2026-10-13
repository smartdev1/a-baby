/**
 * Role: reads road-relevant OSM tags of a way: one-way direction (incl. roundabouts), layer, mapped sidewalks.
 * Owner: backend
 */

import type { Sidewalks } from './road-graph-types.ts';

type Tags = Readonly<Record<string, string>>;

export const onewayOf = (tags: Tags): 1 | 0 | -1 => {
  const value = tags['oneway'];
  if (value === '-1' || value === 'reverse') return -1;
  if (value === 'yes' || value === '1' || value === 'true') return 1;
  if (value === undefined && (tags['junction'] === 'roundabout' || tags['junction'] === 'circular' || tags['highway'] === 'motorway')) return 1;
  return 0;
};

export const layerOf = (tags: Tags): number => {
  const n = Number.parseInt(tags['layer'] ?? '0', 10);
  return Number.isFinite(n) ? Math.max(-5, Math.min(5, n)) : 0;
};

/** Sidewalks mapped on the street itself; `separate` means drawn as footways (found by the parallel-footway search). */
export const mappedSidewalks = (tags: Tags): Sidewalks | 'separate' | null => {
  const value = tags['sidewalk'] ?? tags['sidewalk:both'];
  if (value === 'both' || value === 'yes') return 'both';
  if (value === 'left' || value === 'right' || value === 'none') return value;
  if (value === 'no') return 'none';
  if (value === 'separate') return 'separate';
  return null;
};
