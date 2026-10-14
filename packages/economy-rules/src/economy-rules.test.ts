/**
 * Role: tests ledger leg rules: validation (sum, accounts, zero lines), transfers merged into balanced legs (property), accounts that must stay positive.
 * Owner: backend
 */

import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { legsFromTransfers, legsProblem, mustStayPositive } from './index.ts';

describe('ledger legs', () => {
  it('should accept balanced legs and name the problem otherwise', () => {
    expect(legsProblem([{ account: 'character:c1', amount: -500n }, { account: 'place:osm:node/1', amount: 500n }])).toBeNull();
    expect(legsProblem([{ account: 'character:c1', amount: -500n }])).toMatch(/two legs/);
    expect(legsProblem([{ account: 'character:c1', amount: -500n }, { account: 'place:p', amount: 400n }])).toMatch(/sum to -100/);
    expect(legsProblem([{ account: 'wallet c1', amount: -1n }, { account: 'place:p', amount: 1n }])).toMatch(/invalid account/);
    expect(legsProblem([{ account: 'character:c1', amount: 0n }, { account: 'place:p', amount: 0n }])).toMatch(/zero amount/);
  });

  it('should turn any transfers into balanced, merged legs', () => {
    const account = fc.constantFrom('character:a', 'character:b', 'system:wages', 'place:p');
    fc.assert(
      fc.property(fc.array(fc.record({ from: account, to: account, djai: fc.integer({ min: 1, max: 1_000_000 }) }), { minLength: 1, maxLength: 20 }), (transfers) => {
        const legs = legsFromTransfers(transfers);
        return legs.reduce((s, l) => s + l.amount, 0n) === 0n && new Set(legs.map((l) => l.account)).size === legs.length;
      }),
    );
    expect(() => legsFromTransfers([{ from: 'a', to: 'b', djai: 1.5 }])).toThrow(RangeError);
  });

  it('should keep player money positive but let system sources go negative', () => {
    expect(mustStayPositive('character:c1')).toBe(true);
    expect(mustStayPositive('business:b1')).toBe(true);
    expect(mustStayPositive('system:wages')).toBe(false);
    expect(mustStayPositive('place:osm:node/1')).toBe(false);
  });
});
