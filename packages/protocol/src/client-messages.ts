/**
 * Role: everything a client may send (hello, input, ping, action request and cancel, chat send / block / report): one encoder and one decoder for untrusted frames, used by the gateway.
 * Owner: backend
 */

import { FrameReader } from './binary/frame-reader.ts';
import { CLIENT_MESSAGE } from './message-types.ts';
import { decodePing, encodePing, type PingMessage } from './messages/clock-messages.ts';
import { decodeControl, encodeControl } from './messages/control-codec.ts';
import { type ActionCancelMessage, ActionCancelSchema, type ActionRequestMessage, ActionRequestSchema } from './messages/action-schemas.ts';
import { type ChatBlockMessage, ChatBlockSchema, type ChatReportMessage, ChatReportSchema, type ChatSendMessage, ChatSendSchema } from './messages/chat-schemas.ts';
import { type HelloMessage, HelloSchema } from './messages/control-schemas.ts';
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
  | { readonly type: 'chatReport'; readonly body: ChatReportMessage };

export const encodeClientMessage = (m: ClientMessage): Uint8Array => {
  switch (m.type) {
    case 'hello':
      return encodeControl(CLIENT_MESSAGE.hello, m.body);
    case 'input':
      return encodeInput(m.body);
    case 'ping':
      return encodePing(m.body);
    case 'actionRequest':
      return encodeControl(CLIENT_MESSAGE.actionRequest, m.body);
    case 'actionCancel':
      return encodeControl(CLIENT_MESSAGE.actionCancel, m.body);
    case 'chatSend':
      return encodeControl(CLIENT_MESSAGE.chatSend, m.body);
    case 'chatBlock':
      return encodeControl(CLIENT_MESSAGE.chatBlock, m.body);
    case 'chatReport':
      return encodeControl(CLIENT_MESSAGE.chatReport, m.body);
  }
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
