/**
 * Role: tests the road graph: junctions from shared vertices, no link across bridges without a shared node, oneway and access, sidewalks, components.
 * Owner: backend
 */

import { describe, expect, it } from 'vitest';
import type { ClassifiedRecord, UtmPoint } from '../records/map-records.ts';
import { buildRoadGraph, routableWays } from './build-road-graph.ts';
import { componentStats } from './graph-components.ts';
import { FootwayIndex, sidewalksFor } from './sidewalks.ts';

let next = 1;
const way = (roadClass: string, pts: UtmPoint[], tags: Record<string, string> = {}): ClassifiedRecord => ({
  id: `osm:way/${next++}`,
  geometry: { type: 'LineString', coordinates: pts },
  tags: { highway: roadClass, ...tags },
  isBuilding: false,
  placeCategory: null,
  roadClass,
});

describe('buildRoadGraph', () => {
  it('should split ways at shared vertices and connect them', () => {
    const a = way('residential', [[0, 0], [50, 0], [100, 0]]);
    const b = way('residential', [[50, -50], [50, 0], [50, 50]]);
    const { nodes, edges } = buildRoadGraph(routableWays([a, b]));
    expect(edges).toHaveLength(4); // both ways split at the junction (50, 0)
    expect(nodes).toHaveLength(5);
    expect(componentStats(nodes, edges).components).toBe(1);
    expect(edges[0]).toMatchObject({ lengthM: 50, widthM: 6, cars: true, pedestrians: true, oneway: 0 });
  });

  it('should not connect a bridge crossing a street without a shared node', () => {
    const street = way('residential', [[0, 0], [100, 0]]);
    const bridge = way('primary', [[50, -50], [50, 50]], { bridge: 'yes', layer: '1' });
    const { nodes, edges } = buildRoadGraph(routableWays([street, bridge]));
    expect(edges).toHaveLength(2);
    expect(componentStats(nodes, edges).components).toBe(2);
    expect(edges[1]?.layer).toBe(1);
  });

  it('should read oneway, roundabouts and access, and skip construction', () => {
    const ways = [
      way('primary', [[0, 0], [10, 0]], { oneway: 'yes' }),
      way('tertiary', [[0, 10], [10, 10]], { junction: 'roundabout' }),
      way('secondary', [[0, 20], [10, 20]], { oneway: '-1' }),
      way('motorway', [[0, 30], [10, 30]]),
      way('footway', [[0, 40], [10, 40]]),
      way('construction', [[0, 50], [10, 50]]),
    ];
    const { edges } = buildRoadGraph(routableWays(ways));
    expect(edges.map((e) => e.oneway)).toEqual([1, 1, -1, 1, 0]);
    expect(edges[3]).toMatchObject({ pedestrians: false });
    expect(edges[4]).toMatchObject({ cars: false, pedestrians: true });
  });
});

describe('sidewalksFor', () => {
  it('should generate sidewalks unless tagged or already mapped as a parallel footway', () => {
    const street = buildRoadGraph(routableWays([way('residential', [[0, 0], [100, 0]])])).edges[0]!;
    const noFootways = new FootwayIndex([]);
    expect(sidewalksFor(street, {}, noFootways)).toEqual({ sidewalks: 'both', generated: true });
    expect(sidewalksFor(street, { sidewalk: 'no' }, noFootways).sidewalks).toBe('none');
    expect(sidewalksFor(street, { sidewalk: 'left' }, noFootways)).toEqual({ sidewalks: 'left', generated: false });
    const parallel = new FootwayIndex(buildRoadGraph(routableWays([way('footway', [[0, 5], [100, 5]])])).edges);
    expect(sidewalksFor(street, {}, parallel).sidewalks).toBe('none');
    const crossing = new FootwayIndex(buildRoadGraph(routableWays([way('footway', [[50, -20], [50, 20]])])).edges);
    expect(sidewalksFor(street, {}, crossing).sidewalks).toBe('both');
  });
});
