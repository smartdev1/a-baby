/**
 * Role: road and pedestrian graph records (road-nodes.ndjson, road-edges.ndjson): UTM metres, stable ids, class attributes.
 * Owner: backend
 */

import type { OsmId } from '../osm/osm-id.ts';
import type { UtmPoint } from '../records/map-records.ts';

export interface RoadNode {
  /** `n{index}` in build order (deterministic). */
  readonly id: string;
  readonly position: UtmPoint;
}

export type Sidewalks = 'both' | 'left' | 'right' | 'none';

export interface RoadEdge {
  readonly id: string;
  readonly wayId: OsmId;
  readonly from: string;
  readonly to: string;
  readonly roadClass: string;
  readonly lengthM: number;
  readonly widthM: number;
  /** 1 = only from → to, 0 = both directions, −1 = only to → from (cars). Pedestrians ignore it. */
  readonly oneway: 1 | 0 | -1;
  readonly cars: boolean;
  readonly pedestrians: boolean;
  readonly sidewalks: Sidewalks;
  readonly layer: number;
  readonly geometry: readonly UtmPoint[];
}

export interface RoadGraphStats {
  readonly nodes: number;
  readonly edges: number;
  readonly lengthKm: number;
  readonly components: number;
  /** Share of the total length in the largest connected component. */
  readonly largestComponentShare: number;
  readonly edgesWithGeneratedSidewalks: number;
}
