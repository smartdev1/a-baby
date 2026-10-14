/**
 * Role: TicketVerifier backed by the services internal HTTP route, for a gateway running in its own process.
 * Owner: backend
 */

import type { TicketCheck, TicketVerifier } from './ticket-verifier.ts';

const TIMEOUT_MS = 2000;

export class HttpTicketVerifier implements TicketVerifier {
  constructor(private readonly servicesUrl: string) {}

  /** Any network or HTTP failure counts as an invalid ticket (fail closed). */
  async consume(ticket: string): Promise<TicketCheck | null> {
    try {
      const response = await fetch(`${this.servicesUrl}/internal/v1/session-tickets/consume`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ticket }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!response.ok) return null;
      const body = (await response.json()) as { valid?: unknown; accountId?: unknown };
      if (body.valid !== true) return null;
      return { accountId: typeof body.accountId === 'string' ? body.accountId : null };
    } catch {
      return null;
    }
  }
}
