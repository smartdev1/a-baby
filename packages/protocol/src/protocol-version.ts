/**
 * Role: protocol version checked at handshake; any incompatible change bumps it and updates the compatibility tests (ARCHITECTURE §28 rule 12).
 * Owner: backend
 */

/** v2: action request / cancel, action / needs / wallet updates (T-307). */
/** v3: proximity chat (send, block, report; filtered message, refusal) (T-318). */
export const PROTOCOL_VERSION = 3;
