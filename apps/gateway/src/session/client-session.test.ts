/**
 * Role: tests the gateway session: version and ticket checks, hello first, inputs routed to the cell, cell messages routed back, flood and garbage disconnect.
 * Owner: backend
 */

import { InMemoryBus, subjects } from '@skyline/bus';
import { createLogger } from '@skyline/observability';
import { decodeServerMessage, encodeClientMessage, type ServerMessage } from '@skyline/protocol';
import { describe, expect, it } from 'vitest';
import { ClientSession } from './client-session.ts';

const logger = createLogger({ service: 'test', level: 'silent' });
const hello = (ticket: string, protocolVersion = 1) => encodeClientMessage({ type: 'hello', body: { protocolVersion, ticket, clientBuild: 't' } });
const input = (seq: number) => encodeClientMessage({ type: 'input', body: { seq, moveX: 0, moveZ: 1, yawRad: 0, flags: { run: false, jump: false, interact: false } } });

const setup = (validTicket = 'good') => {
  const bus = new InMemoryBus();
  const sent: ServerMessage[] = [];
  const link = { closed: false, send: (f: Uint8Array) => sent.push(decodeServerMessage(f)), close: () => (link.closed = true) };
  const used = new Set<string>();
  const session = new ClientSession(link, { bus, spawnCell: 'C_1_1', logger, tickets: { consume: (t) => t === validTicket && !used.has(t) && used.add(t) !== undefined } });
  return { bus, sent, link, session };
};

describe('ClientSession', () => {
  it('should reject another protocol version and an invalid ticket', () => {
    const a = setup();
    a.session.receive(hello('good', 0));
    expect(a.sent[0]).toMatchObject({ type: 'error', body: { code: 'version_mismatch' } });
    expect(a.link.closed).toBe(true);
    const b = setup();
    b.session.receive(hello('forged'));
    expect(b.sent[0]).toMatchObject({ type: 'error', body: { code: 'invalid_ticket' } });
  });

  it('should require hello before anything else', () => {
    const { session, sent, link } = setup();
    session.receive(input(1));
    expect(sent[0]).toMatchObject({ type: 'error', body: { code: 'malformed_message' } });
    expect(link.closed).toBe(true);
  });

  it('should join the spawn cell, forward inputs and relay cell messages', () => {
    const { bus, session, sent } = setup();
    const joins: unknown[] = [];
    const inputs: unknown[] = [];
    bus.subscribe(subjects.cellJoin('C_1_1'), (m) => joins.push(m));
    bus.subscribe(subjects.cellInput('C_1_1'), (m) => inputs.push(m));
    session.receive(hello('good'));
    session.receive(input(1));
    bus.publish(subjects.sessionOut(session.sessionId), { type: 'pong', body: { clientTimeMs: 1, serverTimeMs: 2 } });
    expect(joins).toEqual([{ sessionId: session.sessionId }]);
    expect(inputs).toHaveLength(1);
    expect(sent.at(-1)).toMatchObject({ type: 'pong' });
  });

  it('should disconnect a client that keeps sending garbage', () => {
    const { session, link } = setup();
    session.receive(hello('good'));
    for (let k = 0; k < 25; k++) session.receive(Uint8Array.from([250, 1, 2]));
    expect(link.closed).toBe(true);
  });
});
