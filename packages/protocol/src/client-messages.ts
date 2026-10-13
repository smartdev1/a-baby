/**
 * Role: everything a client may send (hello, input, ping): one encoder and one decoder for untrusted frames, used by the gateway.
 * Owner: backend
 */

import { FrameReader } from './binary/frame-reader.ts';
import { CLIENT_MESSAGE } from './message-types.ts';
import { decodePing, encodePing, type PingMessage } from './messages/clock-messages.ts';
import { decodeControl, encodeControl } from './messages/control-codec.ts';
import { type HelloMessage, HelloSchema } from './messages/control-schemas.ts';
import { decodeInput, encodeInput, type InputMessage } from './messages/movement-messages.ts';
import { ProtocolDecodeError } from './protocol-errors.ts';

export type ClientMessage =
  | { readonly type: 'hello'; readonly body: HelloMessage }
  | { readonly type: 'input'; readonly body: InputMessage }
  | { readonly type: 'ping'; readonly body: PingMessage };

export const encodeClientMessage = (m: ClientMessage): Uint8Array => {
  switch (m.type) {
    case 'hello':
      return encodeControl(CLIENT_MESSAGE.hello, m.body);
    case 'input':
      return encodeInput(m.body);
    case 'ping':
      return encodePing(m.body);
  }
};

/** Throws only ProtocolDecodeError. */
export const decodeClientMessage = (bytes: Uint8Array): ClientMessage => {
  if (bytes.byteLength === 0) throw new ProtocolDecodeError('empty', 'empty frame');
  const r = new FrameReader(bytes);
  const type = r.u8('type');
  let message: ClientMessage;
  if (type === CLIENT_MESSAGE.hello) message = { type: 'hello', body: decodeControl(r.rest(), HelloSchema, 'hello') };
  else if (type === CLIENT_MESSAGE.input) message = { type: 'input', body: decodeInput(r) };
  else if (type === CLIENT_MESSAGE.ping) message = { type: 'ping', body: decodePing(r) };
  else throw new ProtocolDecodeError('unknown-type', `unknown client message type ${type}`);
  r.end();
  return message;
};
