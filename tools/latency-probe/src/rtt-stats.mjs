/**
 * Role: latency statistics shared by the browser probe page and the Node aggregator (p50, p95, jitter, loss) — plain ESM, no build step.
 * Owner: backend
 */

/** Nearest-rank percentile of a list of numbers (0 < p ≤ 100). */
export const percentile = (values, p) => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.ceil((p / 100) * sorted.length);
  return sorted[Math.min(Math.max(rank, 1), sorted.length) - 1];
};

/** Mean absolute difference between consecutive RTTs (RFC 3550 style, without smoothing). */
export const jitter = (rtts) => {
  if (rtts.length < 2) return null;
  let sum = 0;
  for (let k = 1; k < rtts.length; k++) sum += Math.abs(rtts[k] - rtts[k - 1]);
  return sum / (rtts.length - 1);
};

const round1 = (v) => (v === null ? null : Math.round(v * 10) / 10);

/** Summary of one or several runs: { samples, p50Ms, p95Ms, jitterMs, lossPct }. */
export const summarize = (rtts, sent) => ({
  samples: rtts.length,
  p50Ms: round1(percentile(rtts, 50)),
  p95Ms: round1(percentile(rtts, 95)),
  jitterMs: round1(jitter(rtts)),
  lossPct: sent > 0 ? round1((100 * (sent - rtts.length)) / sent) : null,
});
