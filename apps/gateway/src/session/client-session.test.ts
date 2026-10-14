/**
 * Role: tests the gateway session: version and ticket checks, hello first, inputs routed to the cell (and to the next cell after a handoff welcome), cell messages routed back, flood and garbage disconnect, resume after a drop (same session, rotated token, expiry, older connection replaced), one session per guest account.
 * Owner: backend
 */

import { InMemoryBus, subjects } from '@skyline/bus';
import { createLogger } from '@skyline/observability';
import { decodeServerMessage, encodeClientMessage, PROTOCOL_VERSION, type ServerMessage } from '@skyline/protocol';
import { describe, expect, it } from 'vitest';
import { CellFanout } from '../routing/cell-fanout.ts';
import { ClientSession } from './client-session.ts';
import { ResumeRegistry } from './resume-registry.ts';

const logger = createLogger({ service: 'test', level: 'silent' });
const hello = (ticket: string, protocolVersion = PROTOCOL_VERSION) => encodeClientMessage({ type: 'hello', body: { protocolVersion, ticket, clientBuild: 't' } });
const input = (seq: number) => encodeClientMessage({ type: 'input', body: { seq, moveX: 0, moveZ: 1, yawRad: 0, flags: { run: false, jump: false, interact: false } } });

const settle = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

const WINDOW_MS = 20;
const resumeHello = (resumeToken: string) => encodeClientMessage({ type: 'hello', body: { protocolVersion: PROTOCOL_VERSION, resumeToken, clientBuild: 't' } });
const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

const setup = (validTicket = 'good', bus = new InMemoryBus(), resumes = new ResumeRegistry(WINDOW_MS), accountId: string | null = null) => {
  const sent: ServerMessage[] = [];
  const link = {
    closed: false,
    send: (f: Uint8Array) => sent.push(decodeServerMessage(f)),
    close: () => (link.closed = true),
  };
  const used = new Set<string>();
  const session = new ClientSession(link, { bus, fanout: new CellFanout(bus), spawnCell: 'C_1_1', logger, resumes, tickets: { consume: (t) => (t === validTicket && !used.has(t) && used.add(t) ? { accountId } : null) } });
  const token = (): string => {
    const info = sent.filter((m) => m.type === 'resumeInfo').at(-1);
    return info?.type === 'resumeInfo' ? info.body.resumeToken : '';
  };
  return { bus, sent, link, session, resumes, token };
};

describe('ClientSession', () => {
  it('should reject another protocol version and an invalid ticket', async () => {
    const a = setup();
    a.session.receive(hello('good', 0));
    expect(a.sent[0]).toMatchObject({ type: 'error', body: { code: 'version_mismatch' } });
    expect(a.link.closed).toBe(true);
    const b = setup();
    b.session.receive(hello('forged'));
    await settle();
    expect(b.sent[0]).toMatchObject({ type: 'error', body: { code: 'invalid_ticket' } });
  });

  it('should require hello before anything else', () => {
    const { session, sent, link } = setup();
    session.receive(input(1));
    expect(sent[0]).toMatchObject({ type: 'error', body: { code: 'malformed_message' } });
    expect(link.closed).toBe(true);
  });

  it('should join the spawn cell, forward inputs and relay cell messages', async () => {
    const { bus, session, sent } = setup();
    const joins: unknown[] = [];
    const inputs: unknown[] = [];
    bus.subscribe(subjects.cellJoin('C_1_1'), (m) => joins.push(m));
    bus.subscribe(subjects.cellInput('C_1_1'), (m) => inputs.push(m));
    session.receive(hello('good'));
    await settle();
    session.receive(input(1));
    bus.publish(subjects.sessionOut(session.sessionId), { type: 'pong', body: { clientTimeMs: 1, serverTimeMs: 2 } });
    expect(joins).toEqual([{ sessionId: session.sessionId }]);
    expect(inputs).toHaveLength(1);
    expect(sent.at(-1)).toMatchObject({ type: 'pong' });
  });

  it('should follow the new cell (inputs, snapshots) once it welcomes the player and announce the close to every cell', async () => {
    const { bus, session, sent } = setup();
    const east: unknown[] = [];
    bus.subscribe(subjects.cellInput('C_2_1'), (m) => east.push(m));
    session.receive(hello('good'));
    await settle();
    const welcome = { protocolVersion: 1, playerEntityId: 7, tickRateHz: 20, frameOrigin: { eastingM: 302_000, northingM: 541_000 }, cellKey: 'C_2_1' };
    bus.publish(subjects.sessionOut(session.sessionId), { type: 'welcome', body: welcome });
    session.receive(input(2));
    expect(east).toHaveLength(1);
    const self = { id: 7, position: { x: 0, y: 0, z: 0 }, yawRad: 0, state: 0 };
    const near = { ...self, id: 8, position: { x: 20, y: 0, z: 0 } };
    const far = { ...self, id: 9, position: { x: 400, y: 0, z: 0 } };
    const snapshot = { type: 'snapshot' as const, body: { tick: 1, entities: [self, near, far] } };
    bus.publish(subjects.cellSnapshot('C_1_1'), snapshot); // old cell: no longer followed
    bus.publish(subjects.cellSnapshot('C_2_1'), snapshot);
    // Interest set: the player and its neighbour, not the one 400 m away.
    expect(sent.filter((m) => m.type === 'snapshot')).toMatchObject([{ body: { entities: [{ id: 7 }, { id: 8 }] } }]);
    const closed: unknown[] = [];
    bus.subscribe(subjects.sessionClosed(), (m) => closed.push(m));
    session.close();
    expect(closed).toEqual([]); // the session waits for a resume
    await wait(WINDOW_MS + 10);
    expect(closed).toEqual([{ sessionId: session.sessionId }]);
  });

  it('should disconnect a client that keeps sending garbage', async () => {
    const { session, link } = setup();
    session.receive(hello('good'));
    await settle();
    for (let k = 0; k < 25; k++) session.receive(Uint8Array.from([250, 1, 2]));
    expect(link.closed).toBe(true);
  });

  it('should resume a dropped session with its token, once, and rotate the token', async () => {
    const a = setup();
    const joins: unknown[] = [];
    const closed: unknown[] = [];
    a.bus.subscribe(subjects.cellJoin('C_1_1'), (m) => joins.push(m));
    a.bus.subscribe(subjects.sessionClosed(), (m) => closed.push(m));
    a.session.receive(hello('good'));
    await settle();
    const first = a.token();
    expect(first).toMatch(/^[A-Za-z0-9_-]{43}$/);
    a.session.close();
    const b = setup('none', a.bus, a.resumes);
    b.session.receive(resumeHello(first));
    expect(b.session.sessionId).toBe(a.session.sessionId);
    expect(joins).toEqual([{ sessionId: a.session.sessionId }, { sessionId: a.session.sessionId }]);
    expect(b.token()).not.toBe(first);
    const c = setup('none', a.bus, a.resumes);
    c.session.receive(resumeHello(first));
    expect(c.sent[0]).toMatchObject({ type: 'error', body: { code: 'invalid_ticket' } });
    await wait(WINDOW_MS + 10);
    expect(closed).toEqual([]);
  });

  it('should end a dropped session that is not resumed in time', async () => {
    const a = setup();
    const closed: unknown[] = [];
    a.bus.subscribe(subjects.sessionClosed(), (m) => closed.push(m));
    a.session.receive(hello('good'));
    await settle();
    a.session.close();
    await wait(WINDOW_MS + 10);
    expect(closed).toEqual([{ sessionId: a.session.sessionId }]);
    const late = setup('none', a.bus, a.resumes);
    late.session.receive(resumeHello(a.token()));
    expect(late.sent[0]).toMatchObject({ type: 'error', body: { code: 'invalid_ticket' } });
  });

  it('should replace an older live connection of the same session', async () => {
    const a = setup();
    const closed: unknown[] = [];
    a.bus.subscribe(subjects.sessionClosed(), (m) => closed.push(m));
    a.session.receive(hello('good'));
    await settle();
    const b = setup('none', a.bus, a.resumes);
    b.session.receive(resumeHello(a.token()));
    expect(a.sent.at(-1)).toMatchObject({ type: 'error', body: { code: 'session_replaced' } });
    expect(a.link.closed).toBe(true);
    a.session.close(); // the old socket's close event
    await wait(WINDOW_MS + 10);
    expect(closed).toEqual([]);
    expect(b.link.closed).toBe(false);
  });

  it('should give a second login of the same account its existing session and tell the cell the character', async () => {
    const a = setup('good', new InMemoryBus(), new ResumeRegistry(WINDOW_MS), 'acc_1');
    const joins: unknown[] = [];
    a.bus.subscribe(subjects.cellJoin('C_1_1'), (m) => joins.push(m));
    a.session.receive(hello('good'));
    await settle();
    const b = setup('again', a.bus, a.resumes, 'acc_1');
    b.session.receive(hello('again'));
    await settle();
    expect(b.session.sessionId).toBe(a.session.sessionId);
    expect(a.sent.at(-1)).toMatchObject({ type: 'error', body: { code: 'session_replaced' } });
    expect(joins).toEqual([
      { sessionId: a.session.sessionId, characterId: 'acc_1' },
      { sessionId: a.session.sessionId, characterId: 'acc_1' },
    ]);
  });
});
