/**
 * Role: shortest routes on the road graph with A* (binary heap, straight-line heuristic, admissible since edge lengths follow the street geometry): node path, edges, length and polyline.
 * Owner: backend
 */

import type { Point, RoadGraph, TravelMode } from './road-graph.ts';

export interface Route {
  readonly nodeIds: readonly string[];
  readonly edgeIds: readonly string[];
  readonly lengthM: number;
  readonly polyline: readonly Point[];
}

/** Min-heap of node indexes by priority (parallel arrays). */
class Heap {
  private readonly nodes: number[] = [];
  private readonly prio: number[] = [];

  get size(): number {
    return this.nodes.length;
  }

  private f(i: number): number {
    return this.prio[i] ?? Infinity;
  }

  private swap(i: number, j: number): void {
    [this.nodes[i], this.nodes[j]] = [this.nodes[j] ?? -1, this.nodes[i] ?? -1];
    [this.prio[i], this.prio[j]] = [this.f(j), this.f(i)];
  }

  push(node: number, f: number): void {
    this.nodes.push(node);
    this.prio.push(f);
    for (let i = this.nodes.length - 1; i > 0 && this.f((i - 1) >> 1) > this.f(i); i = (i - 1) >> 1) this.swap(i, (i - 1) >> 1);
  }

  pop(): number {
    const top = this.nodes[0] ?? -1;
    const lastNode = this.nodes.pop() ?? -1;
    const lastF = this.prio.pop() ?? Infinity;
    if (this.nodes.length > 0) {
      this.nodes[0] = lastNode;
      this.prio[0] = lastF;
      this.siftDown(0);
    }
    return top;
  }

  private siftDown(start: number): void {
    for (let i = start; ; ) {
      const smallest = [2 * i + 1, 2 * i + 2].filter((c) => c < this.nodes.length).reduce((m, c) => (this.f(c) < this.f(m) ? c : m), i);
      if (smallest === i) return;
      this.swap(i, smallest);
      i = smallest;
    }
  }
}

type Step = { readonly node: number; readonly edge: number; readonly reversed: boolean };

const rebuild = (graph: RoadGraph, cameFrom: ReadonlyMap<number, Step>, goal: number, lengthM: number): Route => {
  const nodes = [goal];
  const steps: Step[] = [];
  for (let step = cameFrom.get(goal); step; step = cameFrom.get(step.node)) {
    steps.unshift(step);
    nodes.unshift(step.node);
  }
  const polyline: Point[] = [];
  for (const s of steps) {
    const geometry = graph.edges[s.edge]?.geometry ?? [];
    const pts = s.reversed ? [...geometry].reverse() : geometry;
    polyline.push(...(polyline.length > 0 ? pts.slice(1) : pts));
  }
  return { nodeIds: nodes.map((n) => graph.ids[n] ?? ''), edgeIds: steps.map((s) => graph.edges[s.edge]?.id ?? ''), lengthM: Math.round(lengthM * 100) / 100, polyline };
};

/** Search state of one query. */
class Search {
  readonly g = new Map<number, number>();
  readonly cameFrom = new Map<number, Step>();
  readonly closed = new Set<number>();
  readonly open = new Heap();

  constructor(
    private readonly graph: RoadGraph,
    private readonly mode: TravelMode,
    private readonly h: (n: number) => number,
  ) {}

  /** Relaxes the arcs leaving `node`. */
  expand(node: number): void {
    const base = this.g.get(node) ?? Infinity;
    for (const arc of this.graph.arcsFrom(node, this.mode)) {
      const cost = base + arc.lengthM;
      if (cost >= (this.g.get(arc.to) ?? Infinity)) continue;
      this.g.set(arc.to, cost);
      this.cameFrom.set(arc.to, { node, edge: arc.edge, reversed: arc.reversed });
      this.open.push(arc.to, cost + this.h(arc.to));
    }
  }
}

export interface RouteQuery {
  /** Node indexes (see `RoadGraph.indexOf` / `nearestNode`). */
  readonly from: number;
  readonly to: number;
  readonly mode: TravelMode;
  /** false turns A* into Dijkstra (tests). */
  readonly heuristic?: boolean;
}

/** Shortest route between two nodes, or null when unreachable. */
export const findRoute = (graph: RoadGraph, { from, to, mode, heuristic = true }: RouteQuery): Route | null => {
  const goal = graph.positions[to];
  if (!goal || !graph.positions[from] || !graph.connected(from, to, mode)) return null;
  const weight = heuristic ? 1 : 0;
  const search = new Search(graph, mode, (n) => {
    const p = graph.positions[n] ?? goal;
    return weight * Math.hypot(p[0] - goal[0], p[1] - goal[1]);
  });
  search.g.set(from, 0);
  search.open.push(from, 0);
  while (search.open.size > 0) {
    const node = search.open.pop();
    if (node === to) return rebuild(graph, search.cameFrom, to, search.g.get(to) ?? 0);
    if (search.closed.has(node)) continue;
    search.closed.add(node);
    search.expand(node);
  }
  return null;
};
