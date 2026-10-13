/**
 * Role: public API of @skyline/protocol. Client <-> gateway network protocol: version, message types, bounded binary codecs, error codes.
 * Owner: backend
 */

export { PROTOCOL_VERSION } from './protocol-version.ts';
export { CLIENT_MESSAGE, SERVER_MESSAGE, type ClientMessageType, type ServerMessageType } from './message-types.ts';
export {
  ProtocolDecodeError,
  SERVER_ERROR_CODES,
  type ProtocolDecodeErrorCode,
  type ServerErrorCode,
} from './protocol-errors.ts';
export { decodeClientMessage, encodeClientMessage, type ClientMessage } from './client-messages.ts';
export { decodeServerMessage, encodeServerMessage, type ServerMessage } from './server-messages.ts';
export { checkHello } from './handshake.ts';
export {
  MAX_SNAPSHOT_ENTITIES,
  type EntityState,
  type InputAckMessage,
  type InputFlags,
  type InputMessage,
  type SnapshotMessage,
  type Vec3M,
} from './messages/movement-messages.ts';
export type { PingMessage, PongMessage } from './messages/clock-messages.ts';
export type {
  HelloMessage,
  ServerErrorMessage,
  WelcomeMessage,
  WorldClockMessage,
} from './messages/control-schemas.ts';
