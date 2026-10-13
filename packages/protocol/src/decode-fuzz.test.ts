/**
 * Role: fuzz tests: 10 000 random or mutated frames per direction must only produce ProtocolDecodeError, never another exception.
 * Owner: backend
 */

import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { decodeClientMessage, encodeClientMessage } from './client-messages.ts';
import { ProtocolDecodeError } from './protocol-errors.ts';
import { decodeServerMessage, encodeServerMessage } from './server-messages.ts';

const VALID_CLIENT = [
  encodeClientMessage({ type: 'hello', body: { protocolVersion: 1, ticket: 'abc', clientBuild: 'x' } }),
  encodeClientMessage({
    type: 'input',
    body: { seq: 3, moveX: 0.5, moveZ: -1, yawRad: 1, flags: { run: true, jump: false, interact: true } },
  }),
  encodeClientMessage({ type: 'ping', body: { clientTimeMs: 5 } }),
];
const VALID_SERVER = [
  encodeServerMessage({
    type: 'snapshot',
    body: { tick: 9, entities: [{ id: 1, position: { x: 1, y: 2, z: 3 }, yawRad: 0.5, state: 1 }] },
  }),
  encodeServerMessage({
    type: 'welcome',
    body: {
      protocolVersion: 1,
      playerEntityId: 1,
      tickRateHz: 20,
      frameOrigin: { eastingM: 1, northingM: 2 },
      cellKey: 'C_1_1',
    },
  }),
];

const mutations = (valid: Uint8Array[]) =>
  fc
    .tuple(fc.constantFrom(...valid), fc.nat(), fc.integer({ min: 0, max: 255 }), fc.nat())
    .map(([frame, at, byte, cut]) => {
      const copy = frame.slice(0, cut % (frame.length + 1) || frame.length);
      if (copy.length > 0) copy[at % copy.length] = byte;
      return copy;
    });

const onlyTypedErrors = (decode: (b: Uint8Array) => unknown) => (bytes: Uint8Array) => {
  try {
    decode(bytes);
  } catch (error) {
    expect(error).toBeInstanceOf(ProtocolDecodeError);
  }
};

describe('decoder fuzz', () => {
  it('should only throw ProtocolDecodeError on 10 000 client frames', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.uint8Array({ maxLength: 64 }), mutations(VALID_CLIENT)),
        onlyTypedErrors(decodeClientMessage),
      ),
      { numRuns: 10_000 },
    );
  });

  it('should only throw ProtocolDecodeError on 10 000 server frames', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.uint8Array({ maxLength: 128 }), mutations(VALID_SERVER)),
        onlyTypedErrors(decodeServerMessage),
      ),
      { numRuns: 10_000 },
    );
  });

  it('should reject unknown input flag bits and out-of-range axes', () => {
    const frame = VALID_CLIENT[1]!.slice();
    frame[9] = 0xff;
    expect(() => decodeClientMessage(frame)).toThrow(ProtocolDecodeError);
    const axis = VALID_CLIENT[1]!.slice();
    axis[5] = 0x80; // -128 is outside -127..127
    expect(() => decodeClientMessage(axis)).toThrow(ProtocolDecodeError);
  });
});
