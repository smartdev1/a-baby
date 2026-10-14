/**
 * Role: renders the generated-world statistics as Markdown (world-report.md): tiles per level, budgets, tiles close to the maximum, content counts.
 * Owner: backend
 */

import { TILE_BUDGET_MAX } from '../encoding/tile-budgets.ts';
import { type Distribution, type LevelStats, WARNING_SHARE, type WorldStats } from './world-stats.ts';

const kb = (bytes: number): string => `${(bytes / 1024).toFixed(0)} KB`;
const mb = (bytes: number): string => `${(bytes / 1_048_576).toFixed(1)} MB`;
const int = (n: number): string => Math.round(n).toLocaleString('en-US');
const dist = (d: Distribution | null, unit: (n: number) => string = int): string => (d ? `${unit(d.mean)} / ${unit(d.p95)} / ${unit(d.max)}` : '—');

const levelRow = (l: LevelStats): string =>
  `| ${l.level} | ${int(l.tiles)} | ${mb(l.totalBytes)} | ${dist(l.bytes, kb)} | ${dist(l.triangles)} | ${dist(l.drawCalls)} | ${dist(l.instances)} |`;

const table = (header: string, rows: readonly (readonly [string, number])[]): string[] => [
  `| ${header} | Count |`,
  '|---|---:|',
  ...[...rows].sort((a, b) => b[1] - a[1]).map(([k, n]) => `| ${k} | ${int(n)} |`),
];

export const renderWorldReport = (commune: string, s: WorldStats): string => {
  const { facades, naming } = s.content;
  return [
    `# Generated world — ${commune}`,
    '',
    '## Tiles',
    '',
    `Budgets (ARCHITECTURE §10.4, maximum per tile): ${kb(TILE_BUDGET_MAX.bytes)}, ${int(TILE_BUDGET_MAX.triangles)} triangles, ${TILE_BUDGET_MAX.drawCalls} draw calls. Values are mean / p95 / max.`,
    '',
    '| Level | Tiles | Total | Size | Triangles | Draw calls | Instances |',
    '|---|---:|---:|---|---|---|---|',
    ...s.levels.map(levelRow),
    '',
    `## Tiles above ${WARNING_SHARE * 100} % of a budget maximum`,
    '',
    ...(s.warnings.length === 0
      ? ['None.']
      : ['| Tile | Measure | Value | Maximum |', '|---|---|---:|---:|', ...s.warnings.slice(0, 30).map((w) => `| ${w.tile} | ${w.measure} | ${int(w.value)} | ${int(w.max)} |`)]),
    '',
    '## Content',
    '',
    ...table('Instance family', Object.entries(s.content.instancesByFamily)),
    '',
    ...(facades
      ? [
          `Facades: ${int(facades.withFacades)} of ${int(facades.buildings)} buildings, ${int(facades.instances)} facade instances, ${int(facades.pitchedRoofs)} sheet-metal roofs.`,
          '',
          ...table('Facade profile', Object.entries(facades.byProfile)),
          '',
        ]
      : []),
    ...(naming ? [`Places: ${int(naming.places)}.`, '', ...table('Displayed name source', Object.entries(naming.bySource)), ''] : []),
  ].join('\n');
};
