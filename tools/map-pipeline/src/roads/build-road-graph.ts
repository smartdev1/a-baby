/**
 * Role: builds the road graph from classified ways: vertices shared by several ways (same OSM node ⇒ same coordinates) or way ends become nodes; ways are split into edges between nodes.
 * Owner: backend
 */

import type { ClassifiedRecord, UtmPoint } from '../records/map-records.ts';
import { allowsCars, allowsPedestrians, roadWidthM } from './road-classes.ts';
import type { RoadEdge, RoadNode } from './road-graph-types.ts';
import { layerOf, onewayOf } from './road-way-tags.ts';

/** Ways not routable (planned, removed or not a surface). */
const SKIPPED = new Set(['construction', 'proposed', 'abandoned', 'razed', 'corridor', 'elevator', 'platform', 'raceway', 'bus_stop']);

const keyOf = ([e, n]: UtmPoint): string => `${e},${n}`;
const lengthOf = (pts: readonly UtmPoint[]): number => pts.slice(1).reduce((sum, p, k) => sum + Math.hypot(p[0] - (pts[k]?.[0] ?? 0), p[1] - (pts[k]?.[1] ?? 0)), 0);

interface RoadWay {
  readonly record: ClassifiedRecord;
  readonly roadClass: string;
  readonly line: readonly UtmPoint[];
}

export const routableWays = (records: Iterable<ClassifiedRecord>): RoadWay[] => {
  const ways: RoadWay[] = [];
  for (const record of records) {
    if (!record.roadClass || SKIPPED.has(record.roadClass)) continue;
    const lines = record.geometry.type === 'LineString' ? [record.geometry.coordinates] : record.geometry.type === 'MultiLineString' ? record.geometry.coordinates : [];
    for (const line of lines) if (line.length >= 2) ways.push({ record, roadClass: record.roadClass, line });
  }
  return ways;
};

export interface RoadGraph {
  readonly nodes: RoadNode[];
  readonly edges: Omit<RoadEdge, 'sidewalks'>[];
}

export const buildRoadGraph = (ways: readonly RoadWay[]): RoadGraph => {
  // A vertex is a node when it ends a way or is used more than once (junction).
  const uses = new Map<string, number>();
  for (const { line } of ways) line.forEach((p, k) => uses.set(keyOf(p), (uses.get(keyOf(p)) ?? 0) + (k === 0 || k === line.length - 1 ? 2 : 1)));

  const nodeIds = new Map<string, string>();
  const nodes: RoadNode[] = [];
  const nodeAt = (p: UtmPoint): string => {
    const key = keyOf(p);
    let id = nodeIds.get(key);
    if (!id) {
      id = `n${nodes.length}`;
      nodeIds.set(key, id);
      nodes.push({ id, position: p });
    }
    return id;
  };

  const edges: Omit<RoadEdge, 'sidewalks'>[] = [];
  for (const { record, roadClass, line } of ways) {
    let start = 0;
    for (let k = 1; k < line.length; k++) {
      const p = line[k];
      if (!p || (k < line.length - 1 && (uses.get(keyOf(p)) ?? 0) < 2)) continue;
      const geometry = line.slice(start, k + 1);
      edges.push({
        id: `e${edges.length}`,
        wayId: record.id,
        from: nodeAt(geometry[0] ?? p),
        to: nodeAt(p),
        roadClass,
        lengthM: Math.round(lengthOf(geometry) * 100) / 100,
        widthM: roadWidthM(roadClass),
        oneway: onewayOf(record.tags),
        cars: allowsCars(roadClass),
        pedestrians: allowsPedestrians(roadClass),
        layer: layerOf(record.tags),
        geometry,
      });
      start = k;
    }
  }
  return { nodes, edges };
};
