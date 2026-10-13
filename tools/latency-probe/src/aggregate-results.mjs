/**
 * Role: aggregates the JSON files sent by testers into the SP4 Markdown table (p50 / p95 / jitter / loss per operator, access, slot and region).
 * Owner: backend
 *
 * Usage: node tools/latency-probe/src/aggregate-results.mjs <folder with latency-*.json>
 */

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { summarize } from './rtt-stats.mjs';

/** Groups runs by operator × access × slot × region and merges their samples. */
export const aggregate = (runs) => {
  const groups = new Map();
  for (const run of runs) {
    if (run.error) continue;
    const key = [run.operator, run.access, run.slot, run.region].join(' | ');
    const group = groups.get(key) ?? { rtts: [], sent: 0, runs: 0 };
    group.rtts.push(...run.rttsMs);
    group.sent += run.sent;
    group.runs += 1;
    groups.set(key, group);
  }
  return [...groups.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([key, g]) => ({ key, runs: g.runs, ...summarize(g.rtts, g.sent) }));
};

export const toMarkdown = (rows) =>
  [
    '| Opérateur | Accès | Créneau | Région | Mesures | p50 (ms) | p95 (ms) | Gigue (ms) | Perte (%) |',
    '|---|---|---|---|---:|---:|---:|---:|---:|',
    ...rows.map((r) => `| ${r.key} | ${r.runs} | ${r.p50Ms} | ${r.p95Ms} | ${r.jitterMs} | ${r.lossPct} |`),
  ].join('\n');

if (import.meta.url === `file://${process.argv[1]}`) {
  const folder = process.argv[2];
  if (!folder) throw new Error('usage: aggregate-results.mjs <folder>');
  const files = (await readdir(folder)).filter((f) => f.endsWith('.json'));
  const runs = (await Promise.all(files.map(async (f) => JSON.parse(await readFile(join(folder, f), 'utf8'))))).flat();
  console.log(toMarkdown(aggregate(runs)));
}
