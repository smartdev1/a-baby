/**
 * Role: protocol version checked at handshake; any incompatible change bumps it and updates the compatibility tests (ARCHITECTURE §28 rule 12).
 * Owner: backend
 */

/** v2: action request / cancel, action / needs / wallet updates (T-307). */
export const PROTOCOL_VERSION = 2;
