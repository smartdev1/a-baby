/**
 * Role: tests the protocol v2 daily-life messages: round trips of action request / cancel and action / needs / wallet updates, invalid payloads rejected with typed errors, version 2.
 * Owner: backend
 */

import { describe, expect, it } from 'vitest';
import { decodeClientMessage, decodeServerMessage, encodeClientMessage, encodeServerMessage, PROTOCOL_VERSION, ProtocolDecodeError, type ServerMessage } from './index.ts';

const requestId = '7f9c2a10-1b2c-4d5e-8f90-123456789abc';

describe('protocol v2 action messages', () => {
  it('should be protocol version 2', () => {
    expect(PROTOCOL_VERSION).toBe(4);
  });

  it('should round-trip action request and cancel', () => {
    const request = { type: 'actionRequest' as const, body: { requestId, actionId: 'food.eat_garba', placeId: 'osm:node/5691744460' } };
    expect(decodeClientMessage(encodeClientMessage(request))).toEqual(request);
    const cancel = { type: 'actionCancel' as const, body: { requestId } };
    expect(decodeClientMessage(encodeClientMessage(cancel))).toEqual(cancel);
  });

  it('should round-trip action, needs and wallet updates', () => {
    const messages: ServerMessage[] = [
      { type: 'actionUpdate', body: { requestId, actionId: 'food.eat_garba', state: 'rejected', progress: 0, refusals: [{ code: 'not_enough_money', params: { minDjai: 500 } }, { code: 'place_closed' }] } },
      { type: 'actionUpdate', body: { requestId, actionId: 'food.eat_garba', state: 'running', progress: 0.42, refusals: [] } },
      { type: 'needsUpdate', body: { values: { hunger: 61.5, energy: 80, hygiene: 77.25, social: 40, fun: 0 } } },
      { type: 'walletUpdate', body: { djai: 4500, txId: 'tx-2' } },
    ];
    for (const m of messages) expect(decodeServerMessage(encodeServerMessage(m))).toEqual(m);
  });

  it('should reject invalid payloads with typed errors', () => {
    const bad = [
      encodeClientMessage({ type: 'actionRequest', body: { requestId: 'x', actionId: 'food.eat_garba', placeId: 'osm:node/1' } }),
      encodeClientMessage({ type: 'actionRequest', body: { requestId, actionId: 'Food.Eat', placeId: 'osm:node/1' } }),
      encodeClientMessage({ type: 'actionRequest', body: { requestId, actionId: 'food.eat_garba', placeId: '../etc/passwd' } }),
    ];
    for (const frame of bad) expect(() => decodeClientMessage(frame)).toThrow(ProtocolDecodeError);
    const overflowing = encodeServerMessage({ type: 'actionUpdate', body: { requestId, actionId: 'a.b', state: 'rejected', progress: 0, refusals: Array.from({ length: 17 }, () => ({ code: 'x' })) } });
    expect(() => decodeServerMessage(overflowing)).toThrow(ProtocolDecodeError);
    const negative = encodeServerMessage({ type: 'walletUpdate', body: { djai: -1, txId: null } });
    expect(() => decodeServerMessage(negative)).toThrow(ProtocolDecodeError);
  });
});
