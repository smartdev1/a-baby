/**
 * Role: port used by the gateway to check a single-use session ticket (implemented by the services session-tickets module).
 * Owner: backend
 */

export interface TicketVerifier {
  /** True once per valid ticket (in process, or asynchronously through the services HTTP API). */
  consume(ticket: string): boolean | Promise<boolean>;
}
