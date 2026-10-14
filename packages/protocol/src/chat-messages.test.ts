/**
 * Role: tests the proximity chat messages (protocol v3): round trips of send / block / report and message / refusal, and refusal of oversized texts, other channels and unknown report reasons.
 * Owner: backend
 */

import { describe, expect, it } from 'vitest';
import { type ClientMessage, decodeClientMessage, decodeServerMessage, encodeClientMessage, encodeServerMessage, ProtocolDecodeError, type ServerMessage } from './index.ts';

describe('chat messages', () => {
  it('should round-trip the client and server chat messages', () => {
    const client: ClientMessage[] = [
      { type: 'chatSend', body: { channel: 'proximity', text: 'On dit quoi, le quartier ?' } },
      { type: 'chatBlock', body: { entityId: 42, blocked: true } },
      { type: 'chatReport', body: { entityId: 42, reason: 'scam' } },
    ];
    for (const m of client) expect(decodeClientMessage(encodeClientMessage(m))).toEqual(m);
    const server: ServerMessage[] = [
      { type: 'chatMessage', body: { channel: 'proximity', fromEntityId: 7, text: 'Bonsoir ***' } },
      { type: 'chatRejected', body: { reason: 'rate_limited' } },
    ];
    for (const m of server) expect(decodeServerMessage(encodeServerMessage(m))).toEqual(m);
  });

  it('should refuse texts over 200 characters, other channels and unknown reasons', () => {
    const tooLong = encodeClientMessage({ type: 'chatSend', body: { channel: 'proximity', text: 'a'.repeat(201) } });
    expect(() => decodeClientMessage(tooLong)).toThrow(ProtocolDecodeError);
    const privateChannel = encodeClientMessage({ type: 'chatSend', body: { channel: 'private', text: 'salut' } } as unknown as ClientMessage);
    expect(() => decodeClientMessage(privateChannel)).toThrow(ProtocolDecodeError);
    const reason = encodeClientMessage({ type: 'chatReport', body: { entityId: 1, reason: 'boring' } } as unknown as ClientMessage);
    expect(() => decodeClientMessage(reason)).toThrow(ProtocolDecodeError);
  });
});
