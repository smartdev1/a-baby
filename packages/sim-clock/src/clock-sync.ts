/**
 * Role: client clock synchronisation: estimates the server clock offset from ping/pong samples (lowest-RTT samples win) so the displayed game time follows the server.
 * Owner: backend
 */

export interface SyncSample {
  /** Client clock when the ping was sent and when the pong arrived. */
  readonly sentMs: number;
  readonly receivedMs: number;
  /** Server clock written in the pong. */
  readonly serverMs: number;
}

/** serverClock ≈ clientClock + offset. Uses the median offset of the fastest third of the samples. */
export const estimateServerOffsetMs = (samples: readonly SyncSample[]): number | null => {
  if (samples.length === 0) return null;
  const withRtt = samples.map((s) => ({ rtt: s.receivedMs - s.sentMs, offset: s.serverMs - (s.sentMs + s.receivedMs) / 2 })).sort((a, b) => a.rtt - b.rtt);
  const fastest = withRtt.slice(0, Math.max(1, Math.ceil(withRtt.length / 3))).map((s) => s.offset).sort((a, b) => a - b);
  return fastest[Math.floor((fastest.length - 1) / 2)] ?? null;
};
