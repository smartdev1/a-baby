/**
 * Role: issues single-use gateway session tickets (128-bit random, 60 s) and consumes them; only a hash of each ticket is kept in memory.
 * Owner: backend
 */

import { createHash, randomBytes } from 'node:crypto';

export const TICKET_TTL_MS = 60_000;
const MAX_OUTSTANDING = 10_000;

const hashOf = (ticket: string): string => createHash('sha256').update(ticket).digest('hex');

export interface IssuedTicket {
  readonly ticket: string;
  readonly expiresInMs: number;
}

export class TicketService {
  /** ticket hash → expiry (real ms). */
  private readonly outstanding = new Map<string, number>();

  constructor(private readonly now: () => number) {}

  issue(): IssuedTicket {
    this.purgeExpired();
    if (this.outstanding.size >= MAX_OUTSTANDING) throw new Error('too many outstanding session tickets');
    const ticket = randomBytes(16).toString('base64url');
    this.outstanding.set(hashOf(ticket), this.now() + TICKET_TTL_MS);
    return { ticket, expiresInMs: TICKET_TTL_MS };
  }

  /** True once per valid ticket; a reused, unknown or expired ticket is refused. */
  consume(ticket: string): boolean {
    const key = hashOf(ticket);
    const expiry = this.outstanding.get(key);
    this.outstanding.delete(key);
    return expiry !== undefined && expiry >= this.now();
  }

  private purgeExpired(): void {
    const now = this.now();
    for (const [key, expiry] of this.outstanding) if (expiry < now) this.outstanding.delete(key);
  }
}
