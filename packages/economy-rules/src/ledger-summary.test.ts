/**
 * Role: tests the ledger summary: money supply of characters and businesses, escrow, sources and sinks from system balances.
 * Owner: backend
 */

import { describe, expect, it } from 'vitest';
import { ledgerSummary } from './ledger-summary.ts';

describe('ledger summary', () => {
  it('should split money supply, escrow, sources and sinks', () => {
    const summary = ledgerSummary([
      ['character:a', 4700n],
      ['business:m1', 500n],
      ['escrow:c1:s1', 200n],
      ['system:starter_grant', -5000n],
      ['system:wages', -700n],
      ['system:shops', 300n],
      ['system:transport', 0n],
    ]);
    expect(summary).toEqual({ moneySupplyDjai: 5200, escrowDjai: 200, sources: { 'system:starter_grant': 5000, 'system:wages': 700 }, sinks: { 'system:shops': 300 }, accounts: 7 });
  });
});
