/**
 * Role: public API of @skyline/economy-rules. Pure economy rules and contracts: the EconomyPort (double-entry, idempotent commits) and ledger leg rules; no writes.
 * Owner: backend
 */

export type { EconomyCommitKind, EconomyCommitRequest, EconomyCommitResult, EconomyErrorCode, EconomyPort, LedgerAccountRef, LedgerLeg } from './economy-port.ts';
export { accountKind, characterAccount, legsFromTransfers, legsProblem, mustStayPositive } from './ledger-legs.ts';
