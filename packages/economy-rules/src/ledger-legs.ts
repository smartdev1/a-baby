/**
 * Role: pure rules of ledger legs: account kinds, which accounts must stay ≥ 0, leg validation (≥ 2 legs, non-zero integers, sum = 0) and conversion of transfers (from → to, Djai) into signed legs.
 * Owner: backend
 */

import type { LedgerAccountRef, LedgerLeg } from './economy-port.ts';

const ACCOUNT = /^(character|business|place|escrow|system):[A-Za-z0-9_:./-]{1,120}$/;

export const accountKind = (account: LedgerAccountRef): string => account.slice(0, account.indexOf(':'));

/** Player-owned money can never go negative; system sources and NPC places can. */
export const mustStayPositive = (account: LedgerAccountRef): boolean => {
  const kind = accountKind(account);
  return kind === 'character' || kind === 'business' || kind === 'escrow';
};

export const characterAccount = (characterId: string): LedgerAccountRef => `character:${characterId}`;

/** null when valid, else a short reason. */
export const legsProblem = (legs: readonly LedgerLeg[]): string | null => {
  if (legs.length < 2) return 'a transaction needs at least two legs';
  for (const leg of legs) {
    if (!ACCOUNT.test(leg.account)) return `invalid account "${leg.account}"`;
    if (leg.amount === 0n) return `zero amount on ${leg.account}`;
  }
  const sum = legs.reduce((s, l) => s + l.amount, 0n);
  return sum === 0n ? null : `legs sum to ${sum}, not 0`;
};

/** Transfers (sim-actions economy legs) → signed ledger legs, merged per account; zero lines dropped. */
export const legsFromTransfers = (transfers: readonly { readonly from: string; readonly to: string; readonly djai: number }[]): LedgerLeg[] => {
  const byAccount = new Map<string, bigint>();
  for (const t of transfers) {
    if (!Number.isSafeInteger(t.djai) || t.djai <= 0) throw new RangeError(`invalid Djai amount ${t.djai}`);
    byAccount.set(t.from, (byAccount.get(t.from) ?? 0n) - BigInt(t.djai));
    byAccount.set(t.to, (byAccount.get(t.to) ?? 0n) + BigInt(t.djai));
  }
  return [...byAccount]
    .filter(([, amount]) => amount !== 0n)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([account, amount]) => ({ account, amount }));
};
