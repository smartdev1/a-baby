/**
 * Role: statistics of the generated world from the stage indexes and reports: tiles per level (size, triangles, draw calls, instances), tiles close to the budget maximum, content counts (props, vegetation, facades, roofs, names).
 * Owner: backend
 */

import { TILE_BUDGET_MAX } from '../encoding/tile-budgets.ts';

export interface LevelStats {
  readonly level: string;
  readonly tiles: number;
  readonly totalBytes: number;
  readonly bytes: Distribution;
  readonly triangles: Distribution;
  /** L0 only. */
  readonly drawCalls: Distribution | null;
  readonly instances: Distribution | null;
}

export interface Distribution {
  readonly mean: number;
  readonly p95: number;
  readonly max: number;
}

export interface BudgetWarning {
  readonly tile: string;
  readonly measure: 'bytes' | 'triangles' | 'drawCalls';
  readonly value: number;
  readonly max: number;
}

export interface IndexEntry {
  readonly bytes: number;
  readonly triangles: number;
  readonly drawCalls?: number;
  readonly instanceCount?: number;
}

export interface ContentReports {
  readonly props: { readonly instances: number; readonly byModule: Readonly<Record<string, number>> } | null;
  readonly facades: { readonly buildings: number; readonly withFacades: number; readonly instances: number; readonly pitchedRoofs: number; readonly byProfile: Readonly<Record<string, number>> } | null;
  readonly naming: { readonly places: number; readonly bySource: Readonly<Record<string, number>> } | null;
}

export interface WorldStats {
  readonly levels: readonly LevelStats[];
  readonly warnings: readonly BudgetWarning[];
  readonly content: ContentReports & { readonly instancesByFamily: Readonly<Record<string, number>> };
}

/** A tile above this share of a budget maximum is listed. */
export const WARNING_SHARE = 0.8;

export const distribution = (values: readonly number[]): Distribution => {
  if (values.length === 0) return { mean: 0, p95: 0, max: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const round = (v: number): number => Math.round(v * 10) / 10;
  return { mean: round(sorted.reduce((s, v) => s + v, 0) / sorted.length), p95: sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] ?? 0, max: sorted.at(-1) ?? 0 };
};

const levelOf = (key: string): string => key.slice(0, key.indexOf('_'));

const levelStats = (level: string, entries: readonly IndexEntry[]): LevelStats => {
  const isL0 = level === 'L0';
  return {
    level,
    tiles: entries.length,
    totalBytes: entries.reduce((s, e) => s + e.bytes, 0),
    bytes: distribution(entries.map((e) => e.bytes)),
    triangles: distribution(entries.map((e) => e.triangles)),
    drawCalls: isL0 ? distribution(entries.map((e) => e.drawCalls ?? 0)) : null,
    instances: isL0 ? distribution(entries.map((e) => e.instanceCount ?? 0)) : null,
  };
};

const warningsOf = (key: string, e: IndexEntry): BudgetWarning[] =>
  (
    [
      ['bytes', e.bytes, TILE_BUDGET_MAX.bytes],
      ['triangles', e.triangles, TILE_BUDGET_MAX.triangles],
      ['drawCalls', e.drawCalls ?? 0, TILE_BUDGET_MAX.drawCalls],
    ] as const
  )
    .filter(([, value, max]) => value > max * WARNING_SHARE)
    .map(([measure, value, max]) => ({ tile: key, measure, value, max }));

/** `prp_street_light_a` → `prp`, `veg_tree_mango_a` → `veg`, `bld_parapet_a` → `bld`. */
const familiesOf = (...counts: (Readonly<Record<string, number>> | undefined)[]): Record<string, number> => {
  const out: Record<string, number> = {};
  for (const byModule of counts) for (const [module, n] of Object.entries(byModule ?? {})) out[module.split('_')[0] ?? module] = (out[module.split('_')[0] ?? module] ?? 0) + n;
  return out;
};

export const worldStats = (index: Readonly<Record<string, IndexEntry>>, content: ContentReports & { readonly facadeModules?: Readonly<Record<string, number>> }): WorldStats => {
  const byLevel = new Map<string, IndexEntry[]>();
  for (const [key, e] of Object.entries(index)) {
    const list = byLevel.get(levelOf(key));
    if (list) list.push(e);
    else byLevel.set(levelOf(key), [e]);
  }
  const levels = [...byLevel].sort(([a], [b]) => (a < b ? -1 : 1)).map(([level, entries]) => levelStats(level, entries));
  const warnings = Object.entries(index)
    .flatMap(([key, e]) => warningsOf(key, e))
    .sort((a, b) => b.value / b.max - a.value / a.max);
  const { facadeModules, ...reports } = content;
  return { levels, warnings, content: { ...reports, instancesByFamily: familiesOf(content.props?.byModule, facadeModules) } };
};
