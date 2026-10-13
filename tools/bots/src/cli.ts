/**
 * Role: load test CLI: starts N bots against a running server (all-in-one or multi-process), then prints connection, ack, RTT, bandwidth, handoff and server tick statistics.
 * Owner: backend
 *
 * Usage: pnpm --filter @skyline/bots start -- --bots 50 --seconds 30 [--walk random|east] [--http http://127.0.0.1:8080] [--ws ws://127.0.0.1:2567/ws] [--stats url1,url2]
 */

import { parseArgs } from 'node:util';
import { type BotResult, type BotWalk, runBot } from './bot-client.ts';

const { values } = parseArgs({
  args: process.argv.slice(2).filter((a) => a !== '--'),
  options: {
    bots: { type: 'string', default: '50' },
    seconds: { type: 'string', default: '30' },
    walk: { type: 'string', default: 'random' },
    http: { type: 'string', default: 'http://127.0.0.1:8080' },
    ws: { type: 'string', default: 'ws://127.0.0.1:2567/ws' },
    /** Server statistics endpoints; default = the all-in-one dev route. */
    stats: { type: 'string' },
  },
});

const count = Number(values.bots);
const seconds = Number(values.seconds);
const walk: BotWalk = values.walk === 'east' ? 'east' : 'random';
const percentile = (xs: number[], p: number): number => [...xs].sort((a, b) => a - b)[Math.min(xs.length - 1, Math.floor(p * xs.length))] ?? 0;
const round = (x: number): number => Math.round(x * 10) / 10;
const failed = (e: unknown): BotResult => ({ welcomed: false, acks: 0, snapshots: 0, errors: [String(e)], rttsMs: [], bytesReceived: 0, handoffs: [] });

/** Bots start over one second so the ticket and join bursts stay realistic. */
const results = await Promise.all(
  Array.from({ length: count }, async (_, k) => {
    await new Promise((r) => setTimeout(r, Math.floor((k * 1000) / count)));
    return runBot({ httpUrl: values.http, wsUrl: values.ws, seconds, seed: k + 1, walk }).catch(failed);
  }),
);
const statsUrls = (values.stats ?? `${values.http}/api/v1/dev/zone-stats`).split(',');
const server = await Promise.all(statsUrls.map(async (url) => (await fetch(url).catch(() => null))?.json().catch(() => null) ?? null));
const rtts = results.flatMap((r) => r.rttsMs);
const handoffs = results.flatMap((r) => r.handoffs);

process.stdout.write(
  `${JSON.stringify(
    {
      bots: count,
      seconds,
      walk,
      welcomed: results.filter((r) => r.welcomed).length,
      acksPerBotPerS: round(results.reduce((s, r) => s + r.acks, 0) / count / seconds),
      rttP50Ms: round(percentile(rtts, 0.5)),
      rttP95Ms: round(percentile(rtts, 0.95)),
      downKbitPerBot: round((results.reduce((s, r) => s + r.bytesReceived, 0) * 8) / 1000 / count / seconds),
      handoffs: handoffs.length,
      handoffAckGapP50Ms: round(percentile(handoffs.map((h) => h.ackGapMs), 0.5)),
      handoffAckGapP95Ms: round(percentile(handoffs.map((h) => h.ackGapMs), 0.95)),
      handoffJumpMaxM: round(Math.max(0, ...handoffs.map((h) => h.jumpM)) * 100) / 100,
      errors: [...new Set(results.flatMap((r) => r.errors))],
      server,
    },
    null,
    2,
  )}\n`,
);
