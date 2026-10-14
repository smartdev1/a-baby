/**
 * Role: typed protocol errors: decode failures of untrusted frames and error codes sent to clients.
 * Owner: backend
 */

export type ProtocolDecodeErrorCode =
  'empty' | 'unknown-type' | 'truncated' | 'trailing-bytes' | 'out-of-range' | 'invalid-payload';

export class ProtocolDecodeError extends Error {
  override readonly name = 'ProtocolDecodeError';
  constructor(
    readonly code: ProtocolDecodeErrorCode,
    message: string,
  ) {
    super(`protocol: ${message}`);
  }
}

/** Codes of the `error` message sent by the server. */
export const SERVER_ERROR_CODES = [
  'version_mismatch',
  'invalid_ticket',
  'session_replaced',
  'malformed_message',
  'rate_limited',
  'server_full',
  'internal',
] as const;
export type ServerErrorCode = (typeof SERVER_ERROR_CODES)[number];
