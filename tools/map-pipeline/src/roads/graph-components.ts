/**
 * Role: connected components of the road graph (union-find) and the share of length in the largest one — a measure of OSM network quality.
 * Owner: backend
 */

import type { RoadEdge, RoadNode } from './road-graph-types.ts';

export const componentStats = (
  nodes: readonly RoadNode[],
  edges: readonly Pick<RoadEdge, 'from' | 'to' | 'lengthM'>[],
): { components: number; largestShare: number } => {
  const parent = new Map(nodes.map((n) => [n.id, n.id]));
  const find = (id: string): string => {
    let root = id;
    while (parent.get(root) !== root) root = parent.get(root) ?? root;
    let cur = id;
    while (cur !== root) {
      const next = parent.get(cur) ?? root;
      parent.set(cur, root);
      cur = next;
    }
    return root;
  };
  for (const e of edges) parent.set(find(e.from), find(e.to));
  const lengthByRoot = new Map<string, number>();
  for (const e of edges) lengthByRoot.set(find(e.from), (lengthByRoot.get(find(e.from)) ?? 0) + e.lengthM);
  const total = [...lengthByRoot.values()].reduce((a, b) => a + b, 0);
  const roots = new Set(nodes.map((n) => find(n.id)));
  return { components: roots.size, largestShare: total === 0 ? 0 : Math.max(...lengthByRoot.values()) / total };
};
