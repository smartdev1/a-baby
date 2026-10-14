/**
 * Role: everything the server may send (welcome, input_ack, snapshot, world_clock, pong, error, action / needs / wallet updates, chat message and refusal, ride update, resume info): one encoder and one decoder, used by the gateway and the web client.
 * Owner: backend
 */

import { FrameReader } from './binary/frame-reader.ts';
import { SERVER_MESSAGE } from './message-types.ts';
import { decodePong, encodePong, type PongMessage } from './messages/clock-messages.ts';
import {
  type ActionUpdateMessage,
  ActionUpdateSchema,
  type NeedsUpdateMessage,
  NeedsUpdateSchema,
  type WalletUpdateMessage,
  WalletUpdateSchema,
} from './messages/action-schemas.ts';
import { type ChatMessageBody, ChatMessageSchema, type ChatRejectedMessage, ChatRejectedSchema } from './messages/chat-schemas.ts';
import { decodeControl, encodeControl } from './messages/control-codec.ts';
import { type RideUpdateMessage, RideUpdateSchema } from './messages/ride-schemas.ts';
import {
  type ResumeInfoMessage,
  ResumeInfoSchema,
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
  | { readonly type: 'error'; readonly body: ServerErrorMessage }
  | { readonly type: 'actionUpdate'; readonly body: ActionUpdateMessage }
  | { readonly type: 'needsUpdate'; readonly body: NeedsUpdateMessage }
  | { readonly type: 'walletUpdate'; readonly body: WalletUpdateMessage }
  | { readonly type: 'chatMessage'; readonly body: ChatMessageBody }
  | { readonly type: 'chatRejected'; readonly body: ChatRejectedMessage }
  | { readonly type: 'rideUpdate'; readonly body: RideUpdateMessage }
  | { readonly type: 'resumeInfo'; readonly body: ResumeInfoMessage };

/** Binary messages have their own codec; every other message is a validated control message under its type byte. */
export const encodeServerMessage = (m: ServerMessage): Uint8Array => {
  if (m.type === 'inputAck') return encodeInputAck(m.body);
  if (m.type === 'snapshot') return encodeSnapshot(m.body);
  if (m.type === 'pong') return encodePong(m.body);
  return encodeControl(SERVER_MESSAGE[m.type], m.body);
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
  [SERVER_MESSAGE.actionUpdate]: (r) => ({ type: 'actionUpdate', body: decodeControl(r.rest(), ActionUpdateSchema, 'action_update') }),
  [SERVER_MESSAGE.needsUpdate]: (r) => ({ type: 'needsUpdate', body: decodeControl(r.rest(), NeedsUpdateSchema, 'needs_update') }),
  [SERVER_MESSAGE.walletUpdate]: (r) => ({ type: 'walletUpdate', body: decodeControl(r.rest(), WalletUpdateSchema, 'wallet_update') }),
  [SERVER_MESSAGE.chatMessage]: (r) => ({ type: 'chatMessage', body: decodeControl(r.rest(), ChatMessageSchema, 'chat_message') }),
  [SERVER_MESSAGE.chatRejected]: (r) => ({ type: 'chatRejected', body: decodeControl(r.rest(), ChatRejectedSchema, 'chat_rejected') }),
  [SERVER_MESSAGE.rideUpdate]: (r) => ({ type: 'rideUpdate', body: decodeControl(r.rest(), RideUpdateSchema, 'ride_update') }),
  [SERVER_MESSAGE.resumeInfo]: (r) => ({ type: 'resumeInfo', body: decodeControl(r.rest(), ResumeInfoSchema, 'resume_info') }),
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
