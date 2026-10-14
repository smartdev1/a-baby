/**
 * Role: tests group actions with neighbourhood football: a lobby starts for everyone after the joining window, each player gets the effects, a lone player is refused, a waiting player can cancel.
 * Owner: backend
 */

import { fileURLToPath } from 'node:url';
import type { ActionUpdateMessage, ServerMessage } from '@skyline/protocol';
import { beforeAll, describe, expect, it } from 'vitest';
import { InMemoryEconomy } from '../adapters/in-memory-economy.ts';
import type { CellPlace } from '../world-data/cell-places-loader.ts';
import { DailyLife } from './daily-life.ts';
import { type DailyLifeContent, loadDailyLifeContent } from './daily-life-content.ts';
import { JOIN_WINDOW_MS } from './group-lobby.ts';

const CONTENT = fileURLToPath(new URL('../../../../content', import.meta.url));
const pitch: CellPlace = { id: 'osm:way/900', placeType: 'football_ground', displayName: 'Maracana', sites: [{ kind: 'pitch_slot', capacity: 10, x: 0, z: 0, yawRad: 0 }] };
let content: DailyLifeContent;

beforeAll(async () => {
  content = await loadDailyLifeContent(CONTENT);
});

const setup = () => {
  const clock = { minute: 60 * 24 * 2 + 16 * 60, realMs: 10_000 };
  const sent: { sessionId: string; body: ActionUpdateMessage }[] = [];
  const daily = new DailyLife(
    {
      content,
      places: new Map([[pitch.id, pitch]]),
      economy: new InMemoryEconomy(),
      gameMinute: () => clock.minute,
      clockRatio: () => 12,
      send: (sessionId, m: ServerMessage) => m.type === 'actionUpdate' && sent.push({ sessionId, body: m.body }),
      starterDjai: 0,
      realNow: () => clock.realMs,
    },
    { positionOf: () => ({ x: 5, z: 5 }), nearby: () => 1 },
  );
  const last = (sessionId: string) => sent.filter((s) => s.sessionId === sessionId).at(-1)?.body;
  const play = (sessionId: string, n: number) => daily.handle(sessionId, { type: 'actionRequest', body: { requestId: `dddddddd-0000-4000-8000-00000000000${n}`, actionId: 'sport.play_football', placeId: pitch.id } });
  return { daily, clock, last, play };
};

describe('group actions', () => {
  it('should start the match for all players after the joining window and give each the effects', async () => {
    const { daily, clock, last, play } = setup();
    await daily.addPlayer('a');
    await daily.addPlayer('b');
    const funBefore = daily.needsOf('a')?.values.fun ?? 0;
    await play('a', 1);
    await play('b', 2);
    expect(last('a')?.state).toBe('accepted');
    clock.realMs += JOIN_WINDOW_MS;
    await daily.tick(clock.realMs);
    expect(last('a')?.state).toBe('running');
    expect(last('b')?.state).toBe('running');
    clock.realMs += 121_000;
    await daily.tick(clock.realMs);
    expect(last('a')?.state).toBe('completed');
    expect(last('b')?.state).toBe('completed');
    expect(daily.needsOf('a')?.values.fun).toBeGreaterThan(funBefore + 20);
  });

  it('should refuse a lone player when the window closes, and let a waiting player cancel', async () => {
    const { daily, clock, last, play } = setup();
    await daily.addPlayer('a');
    await daily.addPlayer('b');
    await play('a', 3);
    clock.realMs += JOIN_WINDOW_MS;
    await daily.tick(clock.realMs);
    expect(last('a')).toMatchObject({ state: 'rejected', refusals: [{ code: 'not_enough_players' }] });
    await play('b', 4);
    await daily.handle('b', { type: 'actionCancel', body: { requestId: 'dddddddd-0000-4000-8000-000000000004' } });
    expect(last('b')).toMatchObject({ state: 'interrupted', refusals: [{ code: 'cancelled' }] });
    await play('b', 5);
    expect(last('b')?.state).toBe('accepted');
  });
});
