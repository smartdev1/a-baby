/**
 * Role: token bucket limiting the messages a connection may send (inputs at 20 Hz + pings fit comfortably).
 * Owner: backend
 */

export class RateLimiter {
  private tokens: number;
  private lastMs: number;

  constructor(
    private readonly ratePerS: number,
    private readonly burst: number,
    private readonly now: () => number,
  ) {
    this.tokens = burst;
    this.lastMs = now();
  }

  /** Consumes one token; false when the connection is sending too fast. */
  allow(): boolean {
    const now = this.now();
    this.tokens = Math.min(this.burst, this.tokens + ((now - this.lastMs) / 1000) * this.ratePerS);
    this.lastMs = now;
    if (this.tokens < 1) return false;
    this.tokens -= 1;
    return true;
  }
}
