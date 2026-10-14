/**
 * Role: everything a client may send (hello, input, ping, action request and cancel, chat send / block / report, ride and taxi requests): one encoder and one decoder for untrusted frames, used by the gateway.
 * Owner: backend
 */

import { FrameReader } from './binary/frame-reader.ts';
import { CLIENT_MESSAGE } from './message-types.ts';
import { decodePing, encodePing, type PingMessage } from './messages/clock-messages.ts';
import { decodeControl, encodeControl } from './messages/control-codec.ts';
import { type ActionCancelMessage, ActionCancelSchema, type ActionRequestMessage, ActionRequestSchema } from './messages/action-schemas.ts';
import { type ChatBlockMessage, ChatBlockSchema, type ChatReportMessage, ChatReportSchema, type ChatSendMessage, ChatSendSchema } from './messages/chat-schemas.ts';
import { type HelloMessage, HelloSchema } from './messages/control-schemas.ts';
import { type RideRequestMessage, RideRequestSchema } from './messages/ride-schemas.ts';
import { type TaxiRequestMessage, TaxiRequestSchema } from './messages/taxi-schemas.ts';
import { decodeInput, encodeInput, type InputMessage } from './messages/movement-messages.ts';
import { ProtocolDecodeError } from './protocol-errors.ts';

export type ClientMessage =
  | { readonly type: 'hello'; readonly body: HelloMessage }
  | { readonly type: 'input'; readonly body: InputMessage }
  | { readonly type: 'ping'; readonly body: PingMessage }
  | { readonly type: 'actionRequest'; readonly body: ActionRequestMessage }
  | { readonly type: 'actionCancel'; readonly body: ActionCancelMessage }
  | { readonly type: 'chatSend'; readonly body: ChatSendMessage }
  | { readonly type: 'chatBlock'; readonly body: ChatBlockMessage }
  | { readonly type: 'chatReport'; readonly body: ChatReportMessage }
  | { readonly type: 'rideRequest'; readonly body: RideRequestMessage }
  | { readonly type: 'taxiRequest'; readonly body: TaxiRequestMessage };

/** Binary messages have their own codec; every other message is a validated control message under its type byte. */
export const encodeClientMessage = (m: ClientMessage): Uint8Array => {
  if (m.type === 'input') return encodeInput(m.body);
  if (m.type === 'ping') return encodePing(m.body);
  return encodeControl(CLIENT_MESSAGE[m.type], m.body);
};

const CLIENT_DECODERS: Record<number, (r: FrameReader) => ClientMessage> = {
  [CLIENT_MESSAGE.hello]: (r) => ({ type: 'hello', body: decodeControl(r.rest(), HelloSchema, 'hello') }),
  [CLIENT_MESSAGE.input]: (r) => ({ type: 'input', body: decodeInput(r) }),
  [CLIENT_MESSAGE.ping]: (r) => ({ type: 'ping', body: decodePing(r) }),
  [CLIENT_MESSAGE.actionRequest]: (r) => ({ type: 'actionRequest', body: decodeControl(r.rest(), ActionRequestSchema, 'action_request') }),
  [CLIENT_MESSAGE.actionCancel]: (r) => ({ type: 'actionCancel', body: decodeControl(r.rest(), ActionCancelSchema, 'action_cancel') }),
  [CLIENT_MESSAGE.chatSend]: (r) => ({ type: 'chatSend', body: decodeControl(r.rest(), ChatSendSchema, 'chat_send') }),
  [CLIENT_MESSAGE.chatBlock]: (r) => ({ type: 'chatBlock', body: decodeControl(r.rest(), ChatBlockSchema, 'chat_block') }),
  [CLIENT_MESSAGE.chatReport]: (r) => ({ type: 'chatReport', body: decodeControl(r.rest(), ChatReportSchema, 'chat_report') }),
  [CLIENT_MESSAGE.rideRequest]: (r) => ({ type: 'rideRequest', body: decodeControl(r.rest(), RideRequestSchema, 'ride_request') }),
  [CLIENT_MESSAGE.taxiRequest]: (r) => ({ type: 'taxiRequest', body: decodeControl(r.rest(), TaxiRequestSchema, 'taxi_request') }),
};

/** Throws only ProtocolDecodeError. */
export const decodeClientMessage = (bytes: Uint8Array): ClientMessage => {
  if (bytes.byteLength === 0) throw new ProtocolDecodeError('empty', 'empty frame');
  const r = new FrameReader(bytes);
  const type = r.u8('type');
  const decoder = CLIENT_DECODERS[type];
  if (!decoder) throw new ProtocolDecodeError('unknown-type', `unknown client message type ${type}`);
  const message = decoder(r);
  r.end();
  return message;
};
