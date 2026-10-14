/**
 * Role: issues single-use gateway session tickets (128-bit random, 60 s), bound to the guest account that asked (or to none in anonymous dev mode), and consumes them; only a hash of each ticket is kept in memory.
 * Owner: backend
 */

import { createHash, randomBytes } from 'node:crypto';

export const TICKET_TTL_MS = 60_000;
const MAX_OUTSTANDING = 10_000;

const hashOf = (ticket: string): string => createHash('sha256').update(ticket).digest('hex');

/** What a consumed ticket proves: the account it was issued to (null in anonymous dev mode). */
export interface TicketCheck {
  readonly accountId: string | null;
}

export interface IssuedTicket {
  readonly ticket: string;
  readonly expiresInMs: number;
}

export class TicketService {
  /** ticket hash → expiry (real ms) and account. */
  private readonly outstanding = new Map<string, { expiresAtMs: number; accountId: string | null }>();

  constructor(private readonly now: () => number) {}

  issue(accountId: string | null = null): IssuedTicket {
    this.purgeExpired();
    if (this.outstanding.size >= MAX_OUTSTANDING) throw new Error('too many outstanding session tickets');
    const ticket = randomBytes(16).toString('base64url');
    this.outstanding.set(hashOf(ticket), { expiresAtMs: this.now() + TICKET_TTL_MS, accountId });
    return { ticket, expiresInMs: TICKET_TTL_MS };
  }

  /** The ticket's account once per valid ticket; a reused, unknown or expired ticket gives null. */
  consume(ticket: string): TicketCheck | null {
    const key = hashOf(ticket);
    const entry = this.outstanding.get(key);
    this.outstanding.delete(key);
    return entry !== undefined && entry.expiresAtMs >= this.now() ? { accountId: entry.accountId } : null;
  }

  private purgeExpired(): void {
    const now = this.now();
    for (const [key, entry] of this.outstanding) if (entry.expiresAtMs < now) this.outstanding.delete(key);
  }
}
