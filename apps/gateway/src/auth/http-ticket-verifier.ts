/**
 * Role: TicketVerifier backed by the services internal HTTP route, for a gateway running in its own process.
 * Owner: backend
 */

import type { TicketVerifier } from './ticket-verifier.ts';

const TIMEOUT_MS = 2000;

export class HttpTicketVerifier implements TicketVerifier {
  constructor(private readonly servicesUrl: string) {}

  /** Any network or HTTP failure counts as an invalid ticket (fail closed). */
  async consume(ticket: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.servicesUrl}/internal/v1/session-tickets/consume`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ticket }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!response.ok) return false;
      const body = (await response.json()) as { valid?: unknown };
      return body.valid === true;
    } catch {
      return false;
    }
  }
}
