/**
 * Role: explains empty tiles: collects land-cover polygons (water, wetland, forest, industry…) and classifies each building-free tile by the cover at its centre.
 * Owner: backend
 */

import { bboxOf, containsPoint, type Geometry, type Position } from '../../geometry/geojson-geometry.ts';
import type { BboxLonLat } from '../../geometry/expand-bbox.ts';
import type { OsmFeature } from './feature-stream.ts';

/** Cover classes in priority order (first match wins). `unmapped` = probable mapping gap. */
export const COVER_CLASSES = ['water', 'wetland', 'forest', 'industrial', 'farmland', 'other-landuse', 'unmapped'] as const;
export type CoverClass = (typeof COVER_CLASSES)[number];

interface CoverPolygon {
  readonly cover: Exclude<CoverClass, 'unmapped'>;
  readonly geometry: Geometry;
  readonly bbox: BboxLonLat;
}

type Tags = OsmFeature['properties'];
const has = (tags: Tags, key: string, values: readonly string[]): boolean => values.includes(String(tags[key] ?? ''));

/** Land-cover rules in priority order (first match wins). */
const COVER_RULES: readonly [CoverPolygon['cover'], (tags: Tags) => boolean][] = [
  ['water', (t) => has(t, 'natural', ['water']) || t['water'] !== undefined || has(t, 'landuse', ['basin', 'reservoir'])],
  ['wetland', (t) => has(t, 'natural', ['wetland', 'mud'])],
  ['forest', (t) => has(t, 'natural', ['wood']) || has(t, 'landuse', ['forest']) || has(t, 'leisure', ['nature_reserve']) || has(t, 'boundary', ['protected_area'])],
  ['industrial', (t) => has(t, 'landuse', ['industrial', 'port', 'railway'])],
  ['farmland', (t) => has(t, 'landuse', ['farmland', 'orchard', 'plantation', 'meadow'])],
  ['other-landuse', (t) => t['landuse'] !== undefined || has(t, 'natural', ['scrub', 'grassland', 'sand', 'beach'])],
];

const coverOf = (tags: Tags): CoverPolygon['cover'] | null => COVER_RULES.find(([, test]) => test(tags))?.[0] ?? null;

export class GapCover {
  private readonly polygons: CoverPolygon[] = [];

  collect(feature: OsmFeature): void {
    const g = feature.geometry;
    if (!g || (g.type !== 'Polygon' && g.type !== 'MultiPolygon')) return;
    const cover = coverOf(feature.properties);
    if (cover) this.polygons.push({ cover, geometry: g, bbox: bboxOf(g) });
  }

  classify(point: Position): CoverClass {
    const [lon, lat] = point;
    const hits = this.polygons.filter(
      (p) => lon >= p.bbox[0] && lon <= p.bbox[2] && lat >= p.bbox[1] && lat <= p.bbox[3] && containsPoint(p.geometry, point),
    );
    return COVER_CLASSES.find((c) => hits.some((h) => h.cover === c)) ?? 'unmapped';
  }
}
