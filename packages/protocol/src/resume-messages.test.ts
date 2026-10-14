/**
 * Role: tests the session resume messages (protocol v5): hello with a ticket or a resume token (exactly one), resume info round trip.
 * Owner: backend
 */

import { describe, expect, it } from 'vitest';
import { decodeClientMessage, decodeServerMessage, encodeClientMessage, encodeServerMessage, PROTOCOL_VERSION, ProtocolDecodeError } from './index.ts';

const token = 'A'.repeat(43);

describe('resume messages', () => {
  it('should accept a hello with either a ticket or a resume token', () => {
    for (const body of [{ ticket: 't-1' }, { resumeToken: token }]) {
      const hello = { type: 'hello' as const, body: { protocolVersion: PROTOCOL_VERSION, clientBuild: 'b', ...body } };
      expect(decodeClientMessage(encodeClientMessage(hello))).toEqual(hello);
    }
  });

  it('should refuse a hello with both or neither', () => {
    for (const body of [{ ticket: 't-1', resumeToken: token }, {}]) {
      const frame = encodeClientMessage({ type: 'hello', body: { protocolVersion: PROTOCOL_VERSION, clientBuild: 'b', ...body } });
      expect(() => decodeClientMessage(frame)).toThrow(ProtocolDecodeError);
    }
  });

  it('should round-trip the resume info', () => {
    const info = { type: 'resumeInfo' as const, body: { resumeToken: token, windowS: 60 } };
    expect(decodeServerMessage(encodeServerMessage(info))).toEqual(info);
  });
});
