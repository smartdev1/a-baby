/**
 * Role: the EconomyPort contract (ARCHITECTURE §18): one idempotent double-entry commit per intention, legs summing to zero, integer Djai as bigint; implemented in memory for J3 and by the services economy module later.
 * Owner: backend
 */

/** `character:{id}`, `business:{id}`, `place:{id}` (NPC provider), `escrow:{contract}:{shift}`, `system:{name}`. */
export type LedgerAccountRef = string;

export type EconomyCommitKind =
  | 'purchase'
  | 'wage'
  | 'rent'
  | 'fare'
  | 'transfer'
  | 'grant'
  | 'property_buy'
  | 'property_sell'
  | 'business_restock'
  | 'business_sale'
  | 'escrow_hold'
  | 'escrow_release'
  | 'escrow_refund'
  | 'cash_withdrawal';

export interface LedgerLeg {
  readonly account: LedgerAccountRef;
  /** Credit > 0, debit < 0. */
  readonly amount: bigint;
}

export interface EconomyCommitRequest {
  /** e.g. `action:{requestId}`, `grant:starter:{characterId}`. */
  readonly idempotencyKey: string;
  readonly kind: EconomyCommitKind;
  readonly legs: readonly LedgerLeg[];
  readonly reason: { readonly actionId?: string; readonly placeId?: string; readonly requestId: string };
}

export type EconomyErrorCode = 'INSUFFICIENT_FUNDS' | 'OUT_OF_STOCK' | 'PRICE_OUT_OF_BOUNDS' | 'LIMIT_EXCEEDED' | 'ACCOUNT_FROZEN' | 'INVALID_LEGS';

export type EconomyCommitResult =
  | { readonly ok: true; readonly txId: string; readonly balances: Readonly<Record<LedgerAccountRef, bigint>>; readonly replayed: boolean }
  | { readonly ok: false; readonly code: EconomyErrorCode };

export interface EconomyPort {
  commit(request: EconomyCommitRequest): Promise<EconomyCommitResult>;
  balanceOf(account: LedgerAccountRef): Promise<bigint>;
}
