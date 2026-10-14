/**
 * Role: in-memory EconomyPort of the zone until the PostgreSQL ledger (J6): all-or-nothing double-entry commits, character and business balances never below 0, idempotency by key (a replay returns the first result), sequential commits.
 * Owner: backend
 */

import { type EconomyCommitRequest, type EconomyCommitResult, type EconomyPort, type LedgerAccountRef, ledgerSummary, type LedgerSummary, legsProblem, mustStayPositive } from '@skyline/economy-rules';

export class InMemoryEconomy implements EconomyPort {
  private readonly balances = new Map<LedgerAccountRef, bigint>();
  private readonly byKey = new Map<string, EconomyCommitResult>();
  private nextTx = 1;

  /** The whole body runs in one turn of the event loop: commits never interleave (serializable). */
  commit(request: EconomyCommitRequest): Promise<EconomyCommitResult> {
    const known = this.byKey.get(request.idempotencyKey);
    if (known) return Promise.resolve(known.ok ? { ...known, replayed: true } : known);
    const result = this.apply(request);
    // Refusals are not remembered: the same intention may succeed later (e.g. after a top-up).
    if (result.ok) this.byKey.set(request.idempotencyKey, result);
    return Promise.resolve(result);
  }

  balanceOf(account: LedgerAccountRef): Promise<bigint> {
    return Promise.resolve(this.balances.get(account) ?? 0n);
  }

  /** Sum of every balance: always 0 in a double-entry ledger (tests, metrics). */
  totalBalance(): bigint {
    let sum = 0n;
    for (const v of this.balances.values()) sum += v;
    return sum;
  }

  /** Money supply, sources and sinks (dashboard). */
  summary(): LedgerSummary & { commits: number } {
    return { ...ledgerSummary(this.balances), commits: this.byKey.size };
  }

  get commits(): number {
    return this.byKey.size;
  }

  private apply(request: EconomyCommitRequest): EconomyCommitResult {
    if (legsProblem(request.legs) !== null) return { ok: false, code: 'INVALID_LEGS' };
    const next = new Map<LedgerAccountRef, bigint>();
    for (const leg of request.legs) next.set(leg.account, (next.get(leg.account) ?? this.balances.get(leg.account) ?? 0n) + leg.amount);
    for (const [account, balance] of next) if (balance < 0n && mustStayPositive(account)) return { ok: false, code: 'INSUFFICIENT_FUNDS' };
    for (const [account, balance] of next) this.balances.set(account, balance);
    return { ok: true, txId: `tx-${this.nextTx++}`, balances: Object.fromEntries(next), replayed: false };
  }
}

/** One-time starting money of a new character, paid by `system:starter_grant`. */
export const grantStarterMoney = (economy: EconomyPort, characterId: string, djai: number): Promise<EconomyCommitResult> =>
  economy.commit({
    idempotencyKey: `grant:starter:${characterId}`,
    kind: 'grant',
    legs: [
      { account: 'system:starter_grant', amount: -BigInt(djai) },
      { account: `character:${characterId}`, amount: BigInt(djai) },
    ],
    reason: { requestId: `starter:${characterId}` },
  });
