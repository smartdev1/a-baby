/**
 * Role: tests the latency statistics and the aggregation of tester files into the SP4 table.
 * Owner: backend
 */

import { describe, expect, it } from 'vitest';
import { aggregate, toMarkdown } from './aggregate-results.mjs';
import { jitter, percentile, summarize } from './rtt-stats.mjs';

describe('rtt stats', () => {
  it('should compute nearest-rank percentiles', () => {
    const values = Array.from({ length: 100 }, (_, k) => k + 1);
    expect(percentile(values, 50)).toBe(50);
    expect(percentile(values, 95)).toBe(95);
    expect(percentile([], 50)).toBeNull();
  });

  it('should compute jitter and loss', () => {
    expect(jitter([100, 110, 100, 130])).toBeCloseTo(16.7, 1);
    expect(summarize([100, 120], 4)).toEqual({ samples: 2, p50Ms: 100, p95Ms: 120, jitterMs: 20, lossPct: 50 });
  });

  it('should merge runs of the same operator, access, slot and region', () => {
    const run = { operator: 'Orange', access: '4G', slot: 'soir', region: 'eu-west', rttsMs: [90, 100], sent: 2 };
    const rows = aggregate([run, { ...run, rttsMs: [110], sent: 2 }, { ...run, region: 'lagos', error: 'connection failed' }]);
    expect(rows).toEqual([{ key: 'Orange | 4G | soir | eu-west', runs: 2, samples: 3, p50Ms: 100, p95Ms: 110, jitterMs: 10, lossPct: 25 }]);
    expect(toMarkdown(rows)).toContain('| Orange | 4G | soir | eu-west | 2 | 100 | 110 | 10 | 25 |');
  });
});
