/**
 * Role: regular height grid in UTM metres (cell centres, row 0 = south) with bilinear sampling; the in-memory relief of the whole commune at 5 m.
 * Owner: backend
 */

export interface GridFrame {
  /** South-west corner of the grid (UTM). */
  readonly minE: number;
  readonly minN: number;
  readonly cellM: number;
  readonly cols: number;
  readonly rows: number;
}

export class HeightGrid {
  readonly minE: number;
  readonly minN: number;
  readonly cellM: number;
  readonly cols: number;
  readonly rows: number;

  constructor(
    frame: GridFrame,
    /** cols × rows heights, row-major, row 0 = south. */
    readonly values: Float32Array,
  ) {
    ({ minE: this.minE, minN: this.minN, cellM: this.cellM, cols: this.cols, rows: this.rows } = frame);
  }

  static flat(frame: GridFrame): HeightGrid {
    return new HeightGrid(frame, new Float32Array(frame.cols * frame.rows));
  }

  get(col: number, row: number): number {
    const c = Math.min(this.cols - 1, Math.max(0, col));
    const r = Math.min(this.rows - 1, Math.max(0, row));
    return this.values[r * this.cols + c] ?? 0;
  }

  set(col: number, row: number, value: number): void {
    if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) this.values[row * this.cols + col] = value;
  }

  /** Centre of a cell in UTM. */
  centre(col: number, row: number): [number, number] {
    return [this.minE + (col + 0.5) * this.cellM, this.minN + (row + 0.5) * this.cellM];
  }

  /** Bilinear height at a UTM point (clamped at the edges). */
  sample(e: number, n: number): number {
    const fx = (e - this.minE) / this.cellM - 0.5;
    const fz = (n - this.minN) / this.cellM - 0.5;
    const c = Math.floor(fx);
    const r = Math.floor(fz);
    const tx = fx - c;
    const tz = fz - r;
    return (this.get(c, r) * (1 - tx) + this.get(c + 1, r) * tx) * (1 - tz) + (this.get(c, r + 1) * (1 - tx) + this.get(c + 1, r + 1) * tx) * tz;
  }
}
