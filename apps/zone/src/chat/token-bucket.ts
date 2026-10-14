/**
 * Role: token bucket of one chat sender (1 message per second, burst of 5, ARCHITECTURE §14.2), on an injected clock.
 * Owner: backend
 */

export class TokenBucket {
  private tokens: number;
  private lastMs: number;

  constructor(
    private readonly ratePerS: number,
    private readonly burst: number,
    nowMs: number,
  ) {
    this.tokens = burst;
    this.lastMs = nowMs;
  }

  /** Consumes one token; false when the sender is going too fast. */
  take(nowMs: number): boolean {
    this.tokens = Math.min(this.burst, this.tokens + ((nowMs - this.lastMs) / 1000) * this.ratePerS);
    this.lastMs = nowMs;
    if (this.tokens < 1) return false;
    this.tokens -= 1;
    return true;
  }
}
