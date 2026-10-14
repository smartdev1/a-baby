/**
 * Role: economic dashboard of a ledger (J6-16): money supply (characters and businesses), held in escrow, and each system account — a negative system balance is money issued (source: wages, starter grants), a positive one money removed (sink: shops, transport, fees).
 * Owner: backend
 */

import type { LedgerAccountRef } from './economy-port.ts';
import { accountKind } from './ledger-legs.ts';

export interface LedgerSummary {
  /** Djai held by characters and player businesses. */
  readonly moneySupplyDjai: number;
  readonly escrowDjai: number;
  /** Issued by each source (positive numbers). */
  readonly sources: Readonly<Record<string, number>>;
  /** Collected by each sink. */
  readonly sinks: Readonly<Record<string, number>>;
  readonly accounts: number;
}

export const ledgerSummary = (balances: Iterable<readonly [LedgerAccountRef, bigint]>): LedgerSummary => {
  let supply = 0n;
  let escrow = 0n;
  let accounts = 0;
  const sources: Record<string, number> = {};
  const sinks: Record<string, number> = {};
  for (const [account, balance] of balances) {
    accounts++;
    const kind = accountKind(account);
    if (kind === 'character' || kind === 'business') supply += balance;
    else if (kind === 'escrow') escrow += balance;
    else if (kind === 'system' && balance < 0n) sources[account] = Number(-balance);
    else if (kind === 'system' && balance > 0n) sinks[account] = Number(balance);
  }
  return { moneySupplyDjai: Number(supply), escrowDjai: Number(escrow), sources, sinks, accounts };
};
