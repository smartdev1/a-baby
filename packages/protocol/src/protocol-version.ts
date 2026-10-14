/**
 * Role: protocol version checked at handshake; any incompatible change bumps it and updates the compatibility tests (ARCHITECTURE §28 rule 12).
 * Owner: backend
 */

/** v2: action request / cancel, action / needs / wallet updates (T-307). */
/** v3: proximity chat (send, block, report; filtered message, refusal) (T-318). */
/** v4: line rides (ride request, ride update) (T-320). */
/** v5: session resume (hello with resumeToken, resume info, session_replaced) (T-321). */
/** v6: metered taxis (taxi request, taxi update) (T-322). */
export const PROTOCOL_VERSION = 6;
