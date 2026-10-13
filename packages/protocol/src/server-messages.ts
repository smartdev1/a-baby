/**
 * Role: everything the server may send (welcome, input_ack, snapshot, world_clock, pong, error): one encoder and one decoder, used by the gateway and the web client.
 * Owner: backend
 */

import { FrameReader } from './binary/frame-reader.ts';
import { SERVER_MESSAGE } from './message-types.ts';
import { decodePong, encodePong, type PongMessage } from './messages/clock-messages.ts';
import { decodeControl, encodeControl } from './messages/control-codec.ts';
import {
  type ServerErrorMessage,
  ServerErrorSchema,
  type WelcomeMessage,
  WelcomeSchema,
  type WorldClockMessage,
  WorldClockSchema,
} from './messages/control-schemas.ts';
import {
  decodeInputAck,
  decodeSnapshot,
  encodeInputAck,
  encodeSnapshot,
  type InputAckMessage,
  type SnapshotMessage,
} from './messages/movement-messages.ts';
import { ProtocolDecodeError } from './protocol-errors.ts';

export type ServerMessage =
  | { readonly type: 'welcome'; readonly body: WelcomeMessage }
  | { readonly type: 'inputAck'; readonly body: InputAckMessage }
  | { readonly type: 'snapshot'; readonly body: SnapshotMessage }
  | { readonly type: 'worldClock'; readonly body: WorldClockMessage }
  | { readonly type: 'pong'; readonly body: PongMessage }
  | { readonly type: 'error'; readonly body: ServerErrorMessage };

export const encodeServerMessage = (m: ServerMessage): Uint8Array => {
  switch (m.type) {
    case 'welcome':
      return encodeControl(SERVER_MESSAGE.welcome, m.body);
    case 'inputAck':
      return encodeInputAck(m.body);
    case 'snapshot':
      return encodeSnapshot(m.body);
    case 'worldClock':
      return encodeControl(SERVER_MESSAGE.worldClock, m.body);
    case 'pong':
      return encodePong(m.body);
    case 'error':
      return encodeControl(SERVER_MESSAGE.error, m.body);
  }
};

const DECODERS: Record<number, (r: FrameReader) => ServerMessage> = {
  [SERVER_MESSAGE.welcome]: (r) => ({ type: 'welcome', body: decodeControl(r.rest(), WelcomeSchema, 'welcome') }),
  [SERVER_MESSAGE.inputAck]: (r) => ({ type: 'inputAck', body: decodeInputAck(r) }),
  [SERVER_MESSAGE.snapshot]: (r) => ({ type: 'snapshot', body: decodeSnapshot(r) }),
  [SERVER_MESSAGE.worldClock]: (r) => ({
    type: 'worldClock',
    body: decodeControl(r.rest(), WorldClockSchema, 'world_clock'),
  }),
  [SERVER_MESSAGE.pong]: (r) => ({ type: 'pong', body: decodePong(r) }),
  [SERVER_MESSAGE.error]: (r) => ({ type: 'error', body: decodeControl(r.rest(), ServerErrorSchema, 'error') }),
};

/** Throws only ProtocolDecodeError. */
export const decodeServerMessage = (bytes: Uint8Array): ServerMessage => {
  if (bytes.byteLength === 0) throw new ProtocolDecodeError('empty', 'empty frame');
  const r = new FrameReader(bytes);
  const type = r.u8('type');
  const decoder = DECODERS[type];
  if (!decoder) throw new ProtocolDecodeError('unknown-type', `unknown server message type ${type}`);
  const message = decoder(r);
  r.end();
  return message;
};
