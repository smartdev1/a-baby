/**
 * Role: idempotency and concurrency of daily life (J3-15): 100 concurrent replays of one request settle once, and random sequences of requests, replays, cancels, moves and ticks keep the ledger balanced with no negative player balance.
 * Owner: backend
 */

import { fileURLToPath } from 'node:url';
import fc from 'fast-check';
import { beforeAll, describe, expect, it } from 'vitest';
import { InMemoryEconomy } from '../adapters/in-memory-economy.ts';
import type { CellPlace } from '../world-data/cell-places-loader.ts';
import { DailyLife } from './daily-life.ts';
import { type DailyLifeContent, loadDailyLifeContent } from './daily-life-content.ts';

const CONTENT = fileURLToPath(new URL('../../../../content', import.meta.url));
const NOON = 60 * 24 * 2 + 12 * 60;
const stand: CellPlace = { id: 'osm:node/42', placeType: 'garba_stand', displayName: null, sites: [{ kind: 'seat_or_counter', capacity: 2, x: 0, z: 0, yawRad: 0 }] };
let content: DailyLifeContent;

beforeAll(async () => {
  content = await loadDailyLifeContent(CONTENT);
});

const world = (starterDjai: number) => {
  const economy = new InMemoryEconomy();
  const positions = new Map<string, { x: number; z: number }>();
  const clock = { minute: NOON, realMs: 1_000_000 };
  const daily = new DailyLife(
    { content, places: new Map([[stand.id, stand]]), economy, gameMinute: () => clock.minute, clockRatio: () => 12, send: () => undefined, starterDjai, realNow: () => clock.realMs },
    { positionOf: (id) => positions.get(id) ?? null, nearby: () => 0 },
  );
  return { daily, economy, positions, clock };
};

const rid = (n: number): string => `bbbbbbbb-0000-4000-8000-${String(n).padStart(12, '0')}`;

describe('daily life idempotency', () => {
  it('should run and charge one action for 100 concurrent replays of a request', async () => {
    const { daily, economy, positions, clock } = world(5000);
    const clockAdvance = (ms: number): void => {
      clock.realMs += ms;
    };
    const nowMs = (): number => clock.realMs;
    positions.set('p1', { x: 0, z: 1 });
    await daily.addPlayer('p1');
    const commitsBefore = economy.commits;
    const request = { type: 'actionRequest' as const, body: { requestId: rid(1), actionId: 'food.eat_garba', placeId: stand.id } };
    await Promise.all(Array.from({ length: 100 }, () => daily.handle('p1', request)));
    clockAdvance(60_000);
    await daily.tick(nowMs());
    await Promise.all(Array.from({ length: 100 }, () => daily.handle('p1', request)));
    expect(economy.commits - commitsBefore).toBe(1);
    expect(await economy.balanceOf('character:p1')).toBe(4500n);
  });

  it('should not let another player reuse a request id to eat for free or take a full site', async () => {
    const { daily, economy, positions, clock } = world(5000);
    positions.set('p1', { x: 0, z: 1 });
    positions.set('p2', { x: 0, z: 1 });
    await daily.addPlayer('p1');
    await daily.addPlayer('p2');
    const request = { type: 'actionRequest' as const, body: { requestId: rid(9), actionId: 'food.eat_garba', placeId: stand.id } };
    await daily.handle('p1', request);
    clock.realMs += 60_000;
    await daily.tick(clock.realMs);
    await daily.handle('p2', request);
    clock.realMs += 60_000;
    await daily.tick(clock.realMs);
    expect(await economy.balanceOf('character:p1')).toBe(4500n);
    expect(await economy.balanceOf('character:p2')).toBe(4500n);
    expect(await economy.balanceOf(`place:${stand.id}`)).toBe(1000n);
  });

  it('should keep the ledger balanced and player money positive under any sequence', async () => {
    const op = fc.oneof(
      fc.record({ kind: fc.constant('request' as const), player: fc.constantFrom('p1', 'p2', 'p3'), n: fc.integer({ min: 1, max: 6 }) }),
      fc.record({ kind: fc.constant('cancel' as const), player: fc.constantFrom('p1', 'p2', 'p3'), n: fc.integer({ min: 1, max: 6 }) }),
      fc.record({ kind: fc.constant('move' as const), player: fc.constantFrom('p1', 'p2', 'p3'), far: fc.boolean() }),
      fc.record({ kind: fc.constant('tick' as const), seconds: fc.integer({ min: 1, max: 60 }), gameMinutes: fc.integer({ min: 0, max: 400 }) }),
    );
    await fc.assert(
      fc.asyncProperty(fc.array(op, { minLength: 1, maxLength: 40 }), fc.integer({ min: 0, max: 1500 }), async (ops, starter) => {
        const { daily, economy, positions, clock } = world(starter);
        for (const p of ['p1', 'p2', 'p3']) {
          positions.set(p, { x: 0, z: 1 });
          await daily.addPlayer(p);
        }
        for (const o of ops) {
          if (o.kind === 'request') await daily.handle(o.player, { type: 'actionRequest', body: { requestId: rid(o.n), actionId: 'food.eat_garba', placeId: stand.id } });
          else if (o.kind === 'cancel') await daily.handle(o.player, { type: 'actionCancel', body: { requestId: rid(o.n) } });
          else if (o.kind === 'move') positions.set(o.player, o.far ? { x: 50, z: 50 } : { x: 0, z: 1 });
          else {
            clock.realMs += o.seconds * 1000;
            clock.minute += o.gameMinutes;
            await daily.tick(clock.realMs);
          }
        }
        const balances = await Promise.all(['p1', 'p2', 'p3'].map((p) => economy.balanceOf(`character:${p}`)));
        // At most one purchase commit per distinct request id (+ 3 starter grants).
        const distinct = new Set(ops.flatMap((o) => (o.kind === 'request' ? [`${o.player}:${o.n}`] : []))).size;
        return economy.totalBalance() === 0n && balances.every((b) => b >= 0n) && economy.commits <= distinct + 3;
      }),
      { numRuns: 150 },
    );
  });
});
