/**
 * Role: rolling tick duration statistics of a cell (last 1 200 ticks = 1 minute at 20 Hz): p50, p95, max, overruns.
 * Owner: backend
 */

const WINDOW = 1200;

export interface TickStatsSnapshot {
  readonly ticks: number;
  readonly p50Ms: number;
  readonly p95Ms: number;
  readonly maxMs: number;
  readonly players: number;
}

export class TickStats {
  private readonly durations: number[] = [];
  private ticks = 0;

  record(durationMs: number): void {
    this.ticks++;
    this.durations.push(durationMs);
    if (this.durations.length > WINDOW) this.durations.shift();
  }

  snapshot(players: number): TickStatsSnapshot {
    const sorted = [...this.durations].sort((a, b) => a - b);
    const at = (p: number): number => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))] ?? 0;
    const round = (v: number): number => Math.round(v * 100) / 100;
    return { ticks: this.ticks, p50Ms: round(at(0.5)), p95Ms: round(at(0.95)), maxMs: round(sorted.at(-1) ?? 0), players };
  }
}
