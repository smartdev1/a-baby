/**
 * Role: road and pedestrian graph for routing (built from the pipeline's road-nodes / road-edges): adjacency per travel mode (one-way streets respected for cars only), components per mode and a grid index to find the nearest node.
 * Owner: backend
 */

export type Point = readonly [number, number];
export type TravelMode = 'car' | 'foot';

export interface GraphNode {
  readonly id: string;
  readonly position: Point;
}

export interface GraphEdge {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly lengthM: number;
  /** 1 = only from → to, 0 = both ways, −1 = only to → from (cars). */
  readonly oneway: 1 | 0 | -1;
  readonly cars: boolean;
  readonly pedestrians: boolean;
  readonly geometry: readonly Point[];
}

/** One directed arc of the graph. */
export interface Arc {
  readonly to: number;
  readonly edge: number;
  readonly lengthM: number;
  /** Geometry must be reversed when the arc goes to → from. */
  readonly reversed: boolean;
}

import { type Components, strongComponents, undirectedComponents } from './graph-components.ts';

const CELL_M = 100;

export class RoadGraph {
  readonly positions: Point[] = [];
  readonly ids: string[] = [];
  private readonly indexById = new Map<string, number>();
  private readonly arcs: Record<TravelMode, Arc[][]> = { car: [], foot: [] };
  private readonly grid = new Map<string, number[]>();
  private readonly components: Partial<Record<TravelMode, Components>> = {};

  constructor(
    nodes: readonly GraphNode[],
    readonly edges: readonly GraphEdge[],
  ) {
    for (const n of nodes) {
      this.indexById.set(n.id, this.ids.length);
      this.ids.push(n.id);
      this.positions.push(n.position);
      this.arcs.car.push([]);
      this.arcs.foot.push([]);
      const key = this.cellKey(n.position);
      const cell = this.grid.get(key);
      if (cell) cell.push(this.ids.length - 1);
      else this.grid.set(key, [this.ids.length - 1]);
    }
    edges.forEach((e, k) => this.addEdge(e, k));
  }

  private addEdge(e: GraphEdge, k: number): void {
    const a = this.indexById.get(e.from);
    const b = this.indexById.get(e.to);
    if (a === undefined || b === undefined) return;
    if (e.pedestrians) {
      this.arcs.foot[a]?.push({ to: b, edge: k, lengthM: e.lengthM, reversed: false });
      this.arcs.foot[b]?.push({ to: a, edge: k, lengthM: e.lengthM, reversed: true });
    }
    if (e.cars) {
      if (e.oneway >= 0) this.arcs.car[a]?.push({ to: b, edge: k, lengthM: e.lengthM, reversed: false });
      if (e.oneway <= 0) this.arcs.car[b]?.push({ to: a, edge: k, lengthM: e.lengthM, reversed: true });
    }
  }

  private cellKey([x, z]: Point): string {
    return `${Math.floor(x / CELL_M)}:${Math.floor(z / CELL_M)}`;
  }

  /** Components of the mode (computed once, on first use). */
  componentsOf(mode: TravelMode): Components {
    let c = this.components[mode];
    if (!c) {
      const succ = (n: number): number[] => this.arcsFrom(n, mode).map((a) => a.to);
      c = mode === 'car' ? strongComponents(this.ids.length, succ) : undirectedComponents(this.ids.length, succ);
      this.components[mode] = c;
    }
    return c;
  }

  /** Same component: a route exists between the two nodes. */
  connected(a: number, b: number, mode: TravelMode): boolean {
    const { of } = this.componentsOf(mode);
    return of[a] !== undefined && of[a] === of[b];
  }

  indexOf(id: string): number | undefined {
    return this.indexById.get(id);
  }

  arcsFrom(node: number, mode: TravelMode): readonly Arc[] {
    return this.arcs[mode][node] ?? [];
  }

  /** Grid cells at Chebyshev distance `ring` from (cx, cz). */
  private ringCells(cx: number, cz: number, ring: number): number[] {
    const out: number[] = [];
    for (let dx = -ring; dx <= ring; dx++) {
      for (let dz = -ring; dz <= ring; dz++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) === ring) out.push(...(this.grid.get(`${cx + dx}:${cz + dz}`) ?? []));
      }
    }
    return out;
  }

  /** Nearest node that has arcs for the mode (on the main network only with `mainOnly`), searching rings of grid cells up to `maxM`. */
  nearestNode(point: Point, mode: TravelMode, maxM = 500, mainOnly = false): number | null {
    const usable = (n: number): boolean => this.arcsFrom(n, mode).length > 0 && (!mainOnly || this.componentsOf(mode).of[n] === this.componentsOf(mode).main);
    const [cx, cz] = [Math.floor(point[0] / CELL_M), Math.floor(point[1] / CELL_M)];
    let best: number | null = null;
    let bestD = Infinity;
    for (let ring = 0; ring * CELL_M <= maxM + CELL_M; ring++) {
      for (const n of this.ringCells(cx, cz, ring)) {
        const p = this.positions[n] ?? [Infinity, Infinity];
        const d = Math.hypot(p[0] - point[0], p[1] - point[1]);
        if (d < bestD && d <= maxM && usable(n)) [best, bestD] = [n, d];
      }
      // Any node in a farther ring is at least ring × cell away.
      if (best !== null && bestD <= ring * CELL_M) break;
    }
    return best;
  }
}
