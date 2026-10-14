/**
 * Role: InputIntent — état intentionnel du joueur à chaque frame.
 * Owner: frontend
 *
 * Defines the player's intentional state that the server can
 * authoritatively validate. Never trusts client-predicted state
 * for critical actions (economy, position updates, action sites).
 *
 * Key design notes:
 * - All values are normalized (-1, 0, 1) or booleans.
 * - No raw codes exposed to business logic (encapsulation).
 * - Intentions are *predicted* locally, then *validated* by the server.
 * - Serialized over the wire as a minimal binary packet (see protocol/).
 */

export type InputIntent = {
  /** Horizontal movement: -1 (left), 0 (none), 1 (right) */
  horizontal: number;
  /** Vertical (forward/back) movement: -1 (back), 0 (none), 1 (forward) */
  vertical: number;
  /** Yaw turn: -1 (left), 0 (none), 1 (right) */
  turn: number;
  /** Sprint flag: false = walk, true = sprint (Shift) */
  sprint: boolean;
  /** Interact action flag (E/Enter) */
  interact: boolean;
  /** Look up/down pitch change (mouse or Q/E) */
  pitch: number;
  /** Whether the input is valid (not stale, within debounce) */
  valid: boolean;
};