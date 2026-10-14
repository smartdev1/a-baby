/**
 * Role: tests daily life in a cell with the real content files: eating a garba end to end (Djai to the stand, hunger restored), replayed request settled once, walking away, closed place at night, busy player, full site, a paid maquis shift with its anti-farm cooldown.
 * Owner: backend
 */

import { fileURLToPath } from 'node:url';
import type { ServerMessage } from '@skyline/protocol';
import { beforeAll, describe, expect, it } from 'vitest';
import { InMemoryEconomy } from '../adapters/in-memory-economy.ts';
import type { CellPlace } from '../world-data/cell-places-loader.ts';
import { DailyLife } from './daily-life.ts';
import { type DailyLifeContent, loadDailyLifeContent } from './daily-life-content.ts';

const CONTENT = fileURLToPath(new URL('../../../../content', import.meta.url));
const NOON = 60 * 24 * 2 + 12 * 60;
const stand: CellPlace = { id: 'osm:node/42', placeType: 'garba_stand', displayName: 'Garba chez Tantie', sites: [{ kind: 'seat_or_counter', capacity: 1, x: 10, z: 10, yawRad: 0 }] };
let content: DailyLifeContent;

beforeAll(async () => {
  content = await loadDailyLifeContent(CONTENT);
});

const setup = (gameMinute = NOON) => {
  const economy = new InMemoryEconomy();
  const sent: { sessionId: string; m: ServerMessage }[] = [];
  const positions = new Map<string, { x: number; z: number }>([['s1', { x: 10, z: 11 }], ['s2', { x: 10.5, z: 10 }]]);
  const clock = { minute: gameMinute };
  const daily = new DailyLife(
    { content, places: new Map([[stand.id, stand]]), economy, gameMinute: () => clock.minute, clockRatio: () => 12, send: (sessionId, m) => sent.push({ sessionId, m }), starterDjai: 5000 },
    { positionOf: (id) => positions.get(id) ?? null, nearby: () => 0 },
  );
  const updates = (sessionId = 's1') => sent.filter((s) => s.sessionId === sessionId && s.m.type === 'actionUpdate').map((s) => (s.m.type === 'actionUpdate' ? s.m.body : null));
  return { daily, economy, sent, positions, clock, updates };
};

const garba = (requestId: string) => ({ type: 'actionRequest' as const, body: { requestId, actionId: 'food.eat_garba', placeId: stand.id } });
const ID = 'aaaaaaaa-0000-4000-8000-000000000001';

describe('DailyLife', () => {
  it('should eat a garba end to end: 500 Djai to the stand and hunger restored', async () => {
    const { daily, economy, updates } = setup();
    await daily.addPlayer('s1');
    await daily.handle('s1', garba(ID));
    expect(updates().at(-1)).toMatchObject({ state: 'running', progress: 0 });
    await daily.tick(Date.now() + 46_000);
    expect(updates().at(-1)).toMatchObject({ state: 'completed', progress: 1 });
    expect(await economy.balanceOf('character:s1')).toBe(4500n);
    expect(await economy.balanceOf(`place:${stand.id}`)).toBe(500n);
    expect(daily.needsOf('s1')?.values.hunger).toBe(100);
    expect(economy.totalBalance()).toBe(0n);
  });

  it('should answer a replayed request with its first result and charge once', async () => {
    const { daily, economy, updates } = setup();
    await daily.addPlayer('s1');
    await daily.handle('s1', garba(ID));
    await daily.tick(Date.now() + 46_000);
    const commits = economy.commits;
    await Promise.all(Array.from({ length: 20 }, () => daily.handle('s1', garba(ID))));
    expect(economy.commits).toBe(commits);
    expect(updates().slice(-20).every((u) => u?.state === 'completed')).toBe(true);
    expect(await economy.balanceOf('character:s1')).toBe(4500n);
  });

  it('should interrupt when the player walks away and settle as the file says', async () => {
    const { daily, economy, positions, updates } = setup();
    await daily.addPlayer('s1');
    await daily.handle('s1', garba(ID));
    positions.set('s1', { x: 40, z: 40 });
    await daily.tick(Date.now() + 5_000);
    expect(updates().at(-1)).toMatchObject({ state: 'interrupted', refusals: [{ code: 'walked_away' }] });
    expect(await economy.balanceOf('character:s1')).toBe(4500n); // refund_none_partial_effects
    expect(daily.needsOf('s1')?.values.hunger).toBeLessThan(81);
  });

  it('should refuse at night, while busy, and when the site is full', async () => {
    const night = setup(60 * 24 * 2 + 2 * 60);
    await night.daily.addPlayer('s1');
    await night.daily.handle('s1', garba(ID));
    expect(night.updates().at(-1)?.refusals.map((r) => r.code)).toEqual(['place_closed', 'outside_hours']);
    const day = setup();
    await day.daily.addPlayer('s1');
    await day.daily.addPlayer('s2');
    await day.daily.handle('s1', garba(ID));
    await day.daily.handle('s1', garba('aaaaaaaa-0000-4000-8000-000000000002'));
    expect(day.updates().at(-1)?.refusals).toEqual([{ code: 'busy' }]);
    await day.daily.handle('s2', garba('aaaaaaaa-0000-4000-8000-000000000003'));
    expect(day.updates('s2').at(-1)?.refusals.map((r) => r.code)).toContain('no_free_site');
  });

  it('should pay a night shift at the maquis from system wages, cost energy and refuse a second shift that day', async () => {
    const maquis: CellPlace = { id: 'osm:node/77', placeType: 'maquis', displayName: null, sites: [{ kind: 'staff_post', capacity: 2, x: 10, z: 10, yawRad: 0 }] };
    const economy = new InMemoryEconomy();
    const sent: ServerMessage[] = [];
    const clock = { minute: 60 * 24 * 2 + 19 * 60, realMs: 1_000 };
    const daily = new DailyLife(
      { content, places: new Map([[maquis.id, maquis]]), economy, gameMinute: () => clock.minute, clockRatio: () => 12, send: (_s, m) => sent.push(m), starterDjai: 0, realNow: () => clock.realMs },
      { positionOf: () => ({ x: 10, z: 11 }), nearby: () => 0 },
    );
    await daily.addPlayer('w1');
    const energyBefore = daily.needsOf('w1')?.values.energy ?? 0;
    await daily.handle('w1', { type: 'actionRequest', body: { requestId: 'cccccccc-0000-4000-8000-000000000001', actionId: 'work.serve_maquis', placeId: maquis.id } });
    clock.realMs += 601_000;
    await daily.tick(clock.realMs);
    expect(await economy.balanceOf('character:w1')).toBe(3000n);
    expect(await economy.balanceOf('system:wages')).toBe(-3000n);
    expect(daily.needsOf('w1')?.values.energy).toBeLessThan(energyBefore - 20);
    clock.minute += 60;
    await daily.handle('w1', { type: 'actionRequest', body: { requestId: 'cccccccc-0000-4000-8000-000000000002', actionId: 'work.serve_maquis', placeId: maquis.id } });
    const last = sent.filter((m) => m.type === 'actionUpdate').at(-1);
    expect(last?.type === 'actionUpdate' && last.body.refusals.map((r) => r.code)).toContain('cooldown');
  });
});
