/**
 * Role: round-trip tests of every protocol message (fast-check), with the documented quantization tolerances.
 * Owner: backend
 */

import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { decodeClientMessage, encodeClientMessage } from './client-messages.ts';
import { checkHello } from './handshake.ts';
import { PROTOCOL_VERSION } from './protocol-version.ts';
import { decodeServerMessage, encodeServerMessage } from './server-messages.ts';

const metres = fc.double({ min: -5_000, max: 5_000, noNaN: true });
const vec = fc.record({ x: metres, y: fc.double({ min: -50, max: 300, noNaN: true }), z: metres });
const angle = fc.double({ min: 0, max: Math.PI * 2 - 1e-6, noNaN: true });
const MM = 0.0005 + 1e-9;
const YAW = Math.PI / 65_536 + 1e-9;

const closeVec = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }, tol: number): boolean =>
  Math.abs(a.x - b.x) <= tol && Math.abs(a.y - b.y) <= tol && Math.abs(a.z - b.z) <= tol;

describe('client messages', () => {
  it('should round-trip input within quantization', () => {
    fc.assert(
      fc.property(
        fc.record({ seq: fc.nat(4_294_967_295), moveX: fc.double({ min: -1, max: 1, noNaN: true }), moveZ: fc.double({ min: -1, max: 1, noNaN: true }), yawRad: angle, flags: fc.record({ run: fc.boolean(), jump: fc.boolean(), interact: fc.boolean() }) }),
        (body) => {
          const out = decodeClientMessage(encodeClientMessage({ type: 'input', body }));
          if (out.type !== 'input') return false;
          return (
            out.body.seq === body.seq &&
            Math.abs(out.body.moveX - body.moveX) <= 0.5 / 127 + 1e-9 &&
            Math.abs(out.body.moveZ - body.moveZ) <= 0.5 / 127 + 1e-9 &&
            Math.min(Math.abs(out.body.yawRad - body.yawRad), Math.PI * 2 - Math.abs(out.body.yawRad - body.yawRad)) <= YAW &&
            JSON.stringify(out.body.flags) === JSON.stringify(body.flags)
          );
        },
      ),
    );
  });

  it('should round-trip hello and ping exactly', () => {
    const hello = { type: 'hello', body: { protocolVersion: 1, ticket: 'ticket-123', clientBuild: 'web-0.1.0' } } as const;
    expect(decodeClientMessage(encodeClientMessage(hello))).toEqual(hello);
    expect(decodeClientMessage(encodeClientMessage({ type: 'ping', body: { clientTimeMs: 1234.5 } }))).toEqual({ type: 'ping', body: { clientTimeMs: 1234.5 } });
  });

  it('should keep input frames at 10 bytes', () => {
    expect(encodeClientMessage({ type: 'input', body: { seq: 1, moveX: 0, moveZ: 1, yawRad: 0, flags: { run: false, jump: false, interact: false } } })).toHaveLength(10);
  });
});

describe('server messages', () => {
  it('should round-trip input_ack within 0.5 mm and 0.5 cm/s', () => {
    const speed = fc.double({ min: -50, max: 50, noNaN: true });
    fc.assert(
      fc.property(fc.record({ lastSeq: fc.nat(4_294_967_295), tick: fc.nat(4_294_967_295), position: vec, velocity: fc.record({ x: speed, y: speed, z: speed }) }), (body) => {
        const out = decodeServerMessage(encodeServerMessage({ type: 'inputAck', body }));
        return out.type === 'inputAck' && out.body.lastSeq === body.lastSeq && closeVec(out.body.position, body.position, MM) && closeVec(out.body.velocity, body.velocity, 0.005 + 1e-9);
      }),
    );
  });

  it('should round-trip snapshots of up to 512 entities', () => {
    const entity = fc.record({ id: fc.nat(4_294_967_295), position: vec, yawRad: angle, state: fc.nat(255) });
    fc.assert(
      fc.property(fc.record({ tick: fc.nat(4_294_967_295), entities: fc.array(entity, { maxLength: 512 }) }), (body) => {
        const out = decodeServerMessage(encodeServerMessage({ type: 'snapshot', body }));
        return out.type === 'snapshot' && out.body.entities.length === body.entities.length && out.body.entities.every((e, k) => e.id === body.entities[k]?.id && closeVec(e.position, body.entities[k]?.position ?? e.position, MM));
      }),
      { numRuns: 50 },
    );
  });

  it('should round-trip control messages exactly', () => {
    const messages = [
      { type: 'welcome', body: { protocolVersion: 1, playerEntityId: 7, tickRateHz: 20, frameOrigin: { eastingM: 381_000, northingM: 589_000 }, cellKey: 'C_81_49' } },
      { type: 'worldClock', body: { realStartMs: 1_790_000_000_000, gameStartMin: 480, ratio: 12, paused: false } },
      { type: 'error', body: { code: 'version_mismatch', message: 'please reload' } },
      { type: 'pong', body: { clientTimeMs: 10, serverTimeMs: 1_790_000_000_000 } },
    ] as const;
    for (const m of messages) expect(decodeServerMessage(encodeServerMessage(m))).toEqual(m);
  });

  it('should refuse to encode more than 512 entities', () => {
    const entities = Array.from({ length: 513 }, (_, id) => ({ id, position: { x: 0, y: 0, z: 0 }, yawRad: 0, state: 0 }));
    expect(() => encodeServerMessage({ type: 'snapshot', body: { tick: 1, entities } })).toThrow();
  });
});

describe('checkHello', () => {
  it('should accept the current version and refuse another one', () => {
    expect(checkHello({ protocolVersion: PROTOCOL_VERSION, ticket: 't', clientBuild: '' })).toBeNull();
    expect(checkHello({ protocolVersion: 0, ticket: 't', clientBuild: '' })?.code).toBe('version_mismatch');
  });
});
