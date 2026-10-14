/**
 * Role: connected components of the road graph per travel mode — strongly connected for cars (one-way streets), plain for pedestrians — so unreachable pairs are refused at once and points can snap to the main network.
 * Owner: backend
 */

export interface Components {
  /** Component id per node index. */
  readonly of: Int32Array;
  /** Id of the largest component. */
  readonly main: number;
  readonly count: number;
}

const largest = (of: Int32Array, count: number): number => {
  const sizes = new Int32Array(count);
  for (const c of of) if (c >= 0) sizes[c] = (sizes[c] ?? 0) + 1;
  let main = 0;
  sizes.forEach((s, c) => {
    if (s > (sizes[main] ?? 0)) main = c;
  });
  return main;
};

/** Plain components (pedestrians walk both ways): union-find with path halving. */
export const undirectedComponents = (nodeCount: number, neighbours: (n: number) => Iterable<number>): Components => {
  const parent = Int32Array.from({ length: nodeCount }, (_, i) => i);
  const find = (x: number): number => {
    let r = x;
    while (parent[r] !== r) r = parent[r] = parent[parent[r] ?? r] ?? r;
    return r;
  };
  for (let n = 0; n < nodeCount; n++) for (const m of neighbours(n)) parent[find(n)] = find(m);
  const ids = new Map<number, number>();
  const of = new Int32Array(nodeCount);
  for (let n = 0; n < nodeCount; n++) {
    const root = find(n);
    if (!ids.has(root)) ids.set(root, ids.size);
    of[n] = ids.get(root) ?? 0;
  }
  return { of, main: largest(of, ids.size), count: ids.size };
};

/** Iterative Tarjan state: no recursion depth limit on 18 000 nodes. */
class Tarjan {
  private readonly index: Int32Array;
  private readonly low: Int32Array;
  private readonly onStack: Uint8Array;
  readonly of: Int32Array;
  private readonly stack: number[] = [];
  private readonly work: { node: number; next: number }[] = [];
  private counter = 0;
  count = 0;

  constructor(
    nodeCount: number,
    private readonly successors: (n: number) => readonly number[],
  ) {
    this.index = new Int32Array(nodeCount).fill(-1);
    this.low = new Int32Array(nodeCount);
    this.onStack = new Uint8Array(nodeCount);
    this.of = new Int32Array(nodeCount).fill(-1);
  }

  run(root: number): void {
    if (this.index[root] !== -1) return;
    this.open(root);
    while (this.work.length > 0) this.step();
  }

  private open(n: number): void {
    this.index[n] = this.low[n] = this.counter++;
    this.stack.push(n);
    this.onStack[n] = 1;
    this.work.push({ node: n, next: 0 });
  }

  private step(): void {
    const frame = this.work[this.work.length - 1] as { node: number; next: number };
    const succ = this.successors(frame.node);
    if (frame.next >= succ.length) return this.close(frame.node);
    const m = succ[frame.next++] ?? 0;
    if (this.index[m] === -1) this.open(m);
    else if (this.onStack[m]) this.low[frame.node] = Math.min(this.low[frame.node] ?? 0, this.index[m] ?? 0);
  }

  /** All successors seen: propagate the low link and pop a component when `node` is its root. */
  private close(node: number): void {
    this.work.pop();
    const parent = this.work[this.work.length - 1];
    if (parent) this.low[parent.node] = Math.min(this.low[parent.node] ?? 0, this.low[node] ?? 0);
    if (this.low[node] !== this.index[node]) return;
    for (let m = this.stack.pop(); m !== undefined; m = this.stack.pop()) {
      this.onStack[m] = 0;
      this.of[m] = this.count;
      if (m === node) break;
    }
    this.count++;
  }
}

/** Strongly connected components (cars: one-way streets). */
export const strongComponents = (nodeCount: number, successors: (n: number) => readonly number[]): Components => {
  const t = new Tarjan(nodeCount, successors);
  for (let root = 0; root < nodeCount; root++) t.run(root);
  return { of: t.of, main: largest(t.of, t.count), count: t.count };
};
