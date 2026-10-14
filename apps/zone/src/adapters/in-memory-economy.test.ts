/**
 * Role: tests the in-memory ledger: all-or-nothing commits, no negative player balance, idempotent replays (sequential and 100 concurrent), refusals not remembered, starter grant once, total always 0.
 * Owner: backend
 */

import { describe, expect, it } from 'vitest';
import { grantStarterMoney, InMemoryEconomy } from './in-memory-economy.ts';

const buy = (key: string, djai: bigint) => ({ idempotencyKey: key, kind: 'purchase' as const, legs: [{ account: 'character:c1', amount: -djai }, { account: 'place:p1', amount: djai }], reason: { requestId: key } });

describe('InMemoryEconomy', () => {
  it('should grant starter money once and refuse a purchase above the balance', async () => {
    const eco = new InMemoryEconomy();
    expect((await grantStarterMoney(eco, 'c1', 5000)).ok).toBe(true);
    expect(await grantStarterMoney(eco, 'c1', 5000)).toMatchObject({ ok: true, replayed: true });
    expect(await eco.balanceOf('character:c1')).toBe(5000n);
    expect(await eco.commit(buy('action:a', 6000n))).toEqual({ ok: false, code: 'INSUFFICIENT_FUNDS' });
    expect(await eco.balanceOf('character:c1')).toBe(5000n);
    expect(await eco.commit({ ...buy('action:b', 1n), legs: [{ account: 'character:c1', amount: -1n }] })).toEqual({ ok: false, code: 'INVALID_LEGS' });
  });

  it('should move the balances once for 100 concurrent replays of one key', async () => {
    const eco = new InMemoryEconomy();
    await grantStarterMoney(eco, 'c1', 5000);
    const results = await Promise.all(Array.from({ length: 100 }, () => eco.commit(buy('action:same', 500n))));
    expect(results.filter((r) => r.ok && !r.replayed)).toHaveLength(1);
    expect(new Set(results.map((r) => (r.ok ? r.txId : '')))).toEqual(new Set(['tx-2']));
    expect(await eco.balanceOf('character:c1')).toBe(4500n);
    expect(eco.totalBalance()).toBe(0n);
  });

  it('should let a refused intention succeed later', async () => {
    const eco = new InMemoryEconomy();
    expect((await eco.commit(buy('action:later', 500n))).ok).toBe(false);
    await grantStarterMoney(eco, 'c1', 1000);
    expect((await eco.commit(buy('action:later', 500n))).ok).toBe(true);
  });
});
