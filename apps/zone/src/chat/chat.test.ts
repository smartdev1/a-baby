/**
 * Role: tests the proximity chat: masking of blocked words (accents, leetspeak, repeats), phone numbers and links; delivery within 30 m with the sender's echo; rate limit 1/s burst 5; blocks both ways; report excerpts limited to what the reporter heard; wiring through the cell and the bus.
 * Owner: backend
 */

import { InMemoryBus, subjects } from '@skyline/bus';
import { createLogger } from '@skyline/observability';
import { CollisionWorld } from '@skyline/physics';
import type { ServerMessage } from '@skyline/protocol';
import { describe, expect, it } from 'vitest';
import { InMemoryChatReports } from '../adapters/in-memory-chat-reports.ts';
import { ZoneCell } from '../cell/zone-cell.ts';
import { blockedWordSet, filterChatText } from './chat-filter.ts';
import { type ChatPlayers, ProximityChat } from './proximity-chat.ts';

const words = blockedWordSet(['connard', 'fdp']);

describe('chat filter', () => {
  it('should mask blocked words however they are written', () => {
    expect(filterChatText('espèce de CONNARD', words)).toBe('espèce de *******');
    expect(filterChatText('c0nnnard va', words)).toBe('******** va');
    expect(filterChatText('contre le mur', blockedWordSet(['con']))).toBe('contre le mur');
  });

  it('should mask phone numbers and links, and refuse what is left empty', () => {
    expect(filterChatText('appelle 07 08 09 10 11 ou +225 0102030405', words)).toBe('appelle *** ou ***');
    expect(filterChatText('va sur https://arnaque.example/x ou www.site.ci ou wa.me/225', words)).toBe('va sur *** ou *** ou ***');
    expect(filterChatText('rdv à 18h30, 2 garbas', words)).toBe('rdv à 18h30, 2 garbas');
    expect(filterChatText(' ​\u0007 ', words)).toBeNull();
  });
});

/** Players on a line: s1 at 0 m, s2 at 20 m, s3 at 100 m. */
const line = new Map([['s1', 0], ['s2', 20], ['s3', 100]]);
const players: ChatPlayers = {
  entityOf: (s) => (line.has(s) ? Number(s.slice(1)) : null),
  sessionsWithin: (s, r) => [...line].filter(([, x]) => Math.abs(x - (line.get(s) ?? 1e9)) <= r).map(([id]) => id),
};

const setup = () => {
  const sent: [string, ServerMessage][] = [];
  const reports = new InMemoryChatReports();
  let now = 0;
  const chat = new ProximityChat({ cellKey: 'C_1_1', blockedWords: words, reports, send: (s, m) => sent.push([s, m]), now: () => now }, players);
  const say = (s: string, text: string) => chat.handle(s, { type: 'chatSend', body: { channel: 'proximity', text } });
  return { chat, sent, reports, say, advance: (ms: number) => (now += ms) };
};

describe('proximity chat', () => {
  it('should deliver to the players within 30 m, sender included', async () => {
    const { sent, say } = setup();
    await say('s1', 'on dit quoi ?');
    expect(sent.map(([s, m]) => [s, m.type])).toEqual([['s1', 'chatMessage'], ['s2', 'chatMessage']]);
    expect(sent[1]?.[1]).toEqual({ type: 'chatMessage', body: { channel: 'proximity', fromEntityId: 1, text: 'on dit quoi ?' } });
  });

  it('should allow a burst of 5 then 1 message per second', async () => {
    const { sent, say, advance } = setup();
    for (let k = 0; k < 6; k++) await say('s3', `m${k}`);
    expect(sent.map(([, m]) => m.type)).toEqual([...Array<string>(5).fill('chatMessage'), 'chatRejected']);
    advance(1000);
    await say('s3', 'encore');
    expect(sent.at(-1)?.[1].type).toBe('chatMessage');
  });

  it('should hide the messages between blocked players, both ways', async () => {
    const { chat, sent, say } = setup();
    await chat.handle('s2', { type: 'chatBlock', body: { entityId: 1, blocked: true } });
    await say('s1', 'tu es là ?');
    await say('s2', 'oui');
    expect(sent.map(([s]) => s)).toEqual(['s1', 's2']);
    expect(chat.blocksOf('s2')).toEqual([1]);
  });

  it('should report with an excerpt of what the reporter heard from the reported player only', async () => {
    const { chat, reports, say } = setup();
    await say('s1', 'fdp');
    await say('s2', 'calme toi');
    await chat.handle('s2', { type: 'chatReport', body: { entityId: 1, reason: 'insult' } });
    await chat.handle('s3', { type: 'chatReport', body: { entityId: 1, reason: 'insult' } });
    expect(reports.reports.map((r) => [r.reporterEntityId, r.reportedEntityId, r.excerpt.map((e) => e.text)])).toEqual([
      [2, 1, ['***']],
      [3, 1, []],
    ]);
  });
});

describe('chat in the cell', () => {
  it('should deliver a chat message sent through the bus to the players of the cell', async () => {
    const bus = new InMemoryBus();
    const reports = new InMemoryChatReports();
    const cell = new ZoneCell({
      cellKey: 'C_81_49',
      bus,
      world: new CollisionWorld(),
      frameOrigin: { eastingM: 381_000, northingM: 589_000 },
      spawn: { x: 500, z: 500 },
      clock: () => Promise.resolve({ realStartMs: 0, gameStartMin: 360, ratio: 12, paused: false }),
      logger: createLogger({ service: 'test', level: 'silent' }),
      chat: { blockedWords: words, reports },
    });
    const got: ServerMessage[] = [];
    bus.subscribe<ServerMessage>(subjects.sessionOut('b'), (m) => got.push(m));
    cell.start({ ticking: false });
    bus.publish(subjects.cellJoin('C_81_49'), { sessionId: 'a' });
    bus.publish(subjects.cellJoin('C_81_49'), { sessionId: 'b' });
    await new Promise((r) => setTimeout(r, 0));
    bus.publish(subjects.cellChat('C_81_49'), { sessionId: 'a', message: { type: 'chatSend', body: { channel: 'proximity', text: 'bonsoir' } } });
    await new Promise((r) => setTimeout(r, 0));
    cell.stop();
    expect(got.filter((m) => m.type === 'chatMessage')).toMatchObject([{ body: { text: 'bonsoir', fromEntityId: cell.entityOf('a') } }]);
  });
});
