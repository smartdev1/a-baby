/**
 * Role: tests the journaled economy: balances and idempotency survive a reopen, refused commits are not journaled, a truncated last line is skipped.
 * Owner: backend
 */

import { appendFile, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { grantStarterMoney } from './in-memory-economy.ts';
import { JournaledEconomy } from './journaled-economy.ts';

const dirs: string[] = [];

describe('journaled economy', () => {
  afterAll(() => Promise.all(dirs.map((d) => rm(d, { recursive: true, force: true }))));

  it('should keep balances and idempotency across a reopen', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'skyline-ledger-'));
    dirs.push(dir);
    const path = join(dir, 'ledger.ndjson');
    const first = await JournaledEconomy.open(path);
    await grantStarterMoney(first, 'acc_1', 5000);
    const buy = { idempotencyKey: 'action:acc_1:r1', kind: 'purchase' as const, legs: [{ account: 'character:acc_1', amount: -300n }, { account: 'system:shops', amount: 300n }], reason: { requestId: 'r1' } };
    expect((await first.commit(buy)).ok).toBe(true);
    const tooMuch = { ...buy, idempotencyKey: 'action:acc_1:r2', legs: [{ account: 'character:acc_1', amount: -99_999n }, { account: 'system:shops', amount: 99_999n }] };
    expect(await first.commit(tooMuch)).toEqual({ ok: false, code: 'INSUFFICIENT_FUNDS' });
    expect((await readFile(path, 'utf8')).trim().split('\n')).toHaveLength(2);

    await appendFile(path, '{"key":"half');
    const skipped: number[] = [];
    const reopened = await JournaledEconomy.open(path, (line) => skipped.push(line));
    expect(skipped).toEqual([3]);
    expect(await reopened.balanceOf('character:acc_1')).toBe(4700n);
    expect(await grantStarterMoney(reopened, 'acc_1', 5000)).toMatchObject({ ok: true, replayed: true });
    expect(await reopened.balanceOf('character:acc_1')).toBe(4700n);
    expect(reopened.totalBalance()).toBe(0n);
    await reopened.commit({ ...buy, idempotencyKey: 'action:acc_1:r3' });
    expect(await (await JournaledEconomy.open(path)).balanceOf('character:acc_1')).toBe(4400n);
  });
});
