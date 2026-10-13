/**
 * Role: load test CLI: starts N bots against a running all-in-one server, then prints connection, ack, RTT and server tick statistics.
 * Owner: backend
 *
 * Usage: pnpm --filter @skyline/bots start -- --bots 50 --seconds 30 [--http http://127.0.0.1:8080] [--ws ws://127.0.0.1:2567/ws]
 */

import { parseArgs } from 'node:util';
import { runBot } from './bot-client.ts';

const { values } = parseArgs({
  args: process.argv.slice(2).filter((a) => a !== '--'),
  options: {
    bots: { type: 'string', default: '50' },
    seconds: { type: 'string', default: '30' },
    http: { type: 'string', default: 'http://127.0.0.1:8080' },
    ws: { type: 'string', default: 'ws://127.0.0.1:2567/ws' },
  },
});

const count = Number(values.bots);
const seconds = Number(values.seconds);
const percentile = (xs: number[], p: number): number => [...xs].sort((a, b) => a - b)[Math.min(xs.length - 1, Math.floor(p * xs.length))] ?? 0;

const results = await Promise.all(
  Array.from({ length: count }, (_, k) => runBot({ httpUrl: values.http, wsUrl: values.ws, seconds, seed: k + 1 }).catch((e: unknown) => ({ welcomed: false, acks: 0, snapshots: 0, errors: [String(e)], rttsMs: [] }))),
);
const zoneStats: unknown = await (await fetch(`${values.http}/api/v1/dev/zone-stats`)).json();
const rtts = results.flatMap((r) => r.rttsMs);

process.stdout.write(
  `${JSON.stringify(
    {
      bots: count,
      seconds,
      welcomed: results.filter((r) => r.welcomed).length,
      acksPerBotPerS: Math.round((results.reduce((s, r) => s + r.acks, 0) / count / seconds) * 10) / 10,
      rttP50Ms: Math.round(percentile(rtts, 0.5) * 10) / 10,
      rttP95Ms: Math.round(percentile(rtts, 0.95) * 10) / 10,
      errors: results.flatMap((r) => r.errors),
      zone: zoneStats,
    },
    null,
    2,
  )}\n`,
);
