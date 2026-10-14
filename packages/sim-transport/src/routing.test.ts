/**
 * Role: tests routing: one-way streets for cars but not for pedestrians, unreachable nodes, polyline and length, nearest node, and A* equal to Dijkstra on random grid graphs (property).
 * Owner: backend
 */

import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { findRoute, type GraphEdge, type GraphNode, RoadGraph } from './index.ts';

const node = (id: string, x: number, z: number): GraphNode => ({ id, position: [x, z] });
const edge = (id: string, from: GraphNode, to: GraphNode, over: Partial<GraphEdge> = {}): GraphEdge => ({
  id,
  from: from.id,
  to: to.id,
  lengthM: Math.hypot(to.position[0] - from.position[0], to.position[1] - from.position[1]),
  oneway: 0,
  cars: true,
  pedestrians: true,
  geometry: [from.position, to.position],
  ...over,
});

/** a —(one way a→b)— b, and a long detour a — c — b. */
const [a, b, c, d] = [node('a', 0, 0), node('b', 100, 0), node('c', 50, 80), node('d', 500, 500)];
const graph = new RoadGraph([a, b, c, d], [edge('ab', a, b, { oneway: 1 }), edge('ac', a, c), edge('cb', c, b)]);
const at = (id: string): number => graph.indexOf(id) ?? -1;

describe('findRoute', () => {
  it('should respect one-way streets for cars only', () => {
    expect(findRoute(graph, { from: at('a'), to: at('b'), mode: 'car' })?.edgeIds).toEqual(['ab']);
    const back = findRoute(graph, { from: at('b'), to: at('a'), mode: 'car' });
    expect(back?.edgeIds).toEqual(['cb', 'ac']);
    expect(back?.polyline).toEqual([[100, 0], [50, 80], [0, 0]]);
    expect(findRoute(graph, { from: at('b'), to: at('a'), mode: 'foot' })?.edgeIds).toEqual(['ab']);
    expect(findRoute(graph, { from: at('b'), to: at('a'), mode: 'foot' })?.lengthM).toBe(100);
  });

  it('should return null when the target is unreachable', () => {
    expect(findRoute(graph, { from: at('a'), to: at('d'), mode: 'foot' })).toBeNull();
  });

  it('should find the nearest node usable by the mode', () => {
    expect(graph.nearestNode([95, 3], 'car')).toBe(at('b'));
    expect(graph.nearestNode([490, 490], 'car')).toBeNull();
  });

  it('should give the same length as Dijkstra on random grid graphs', () => {
    fc.assert(
      fc.property(fc.array(fc.tuple(fc.integer({ min: 0, max: 15 }), fc.integer({ min: 0, max: 1 }), fc.constantFrom<0 | 1>(0, 1), fc.double({ min: 1, max: 1.8, noNaN: true })), { minLength: 10, maxLength: 60 }), (spec) => {
        const nodes = Array.from({ length: 16 }, (_, k) => node(`n${k}`, (k % 4) * 100, Math.floor(k / 4) * 100));
        const edges = spec.flatMap(([k, horizontal, oneway, detour], i) => {
          const from = nodes[k];
          const toIndex = horizontal ? (k % 4 < 3 ? k + 1 : -1) : k + 4 < 16 ? k + 4 : -1;
          const to = nodes[toIndex];
          if (!from || !to) return [];
          return [{ ...edge(`e${i}`, from, to, { oneway }), lengthM: 100 * detour }];
        });
        const g = new RoadGraph(nodes, edges);
        const astar = findRoute(g, { from: 0, to: 15, mode: 'car' });
        const dijkstra = findRoute(g, { from: 0, to: 15, mode: 'car', heuristic: false });
        return (astar === null) === (dijkstra === null) && Math.abs((astar?.lengthM ?? 0) - (dijkstra?.lengthM ?? 0)) < 0.011;
      }),
    );
  });
});
