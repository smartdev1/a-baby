/**
 * Role: port used by the gateway to check a single-use session ticket (implemented by the services session-tickets module): the account it was issued to, or null when invalid.
 * Owner: backend
 */

export interface TicketCheck {
  /** Guest account of the ticket; null for an anonymous dev ticket. */
  readonly accountId: string | null;
}

export interface TicketVerifier {
  /** Once per valid ticket (in process, or asynchronously through the services HTTP API); null when invalid. */
  consume(ticket: string): TicketCheck | null | Promise<TicketCheck | null>;
}
