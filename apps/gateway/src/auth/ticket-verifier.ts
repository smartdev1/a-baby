/**
 * Role: port used by the gateway to check a single-use session ticket (implemented by the services session-tickets module).
 * Owner: backend
 */

export interface TicketVerifier {
  /** True once per valid ticket. */
  consume(ticket: string): boolean;
}
