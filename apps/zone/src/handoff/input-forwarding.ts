/**
 * Role: remembers players recently handed to another cell, so inputs still routed here (the gateway switches cell on the next welcome) are forwarded instead of lost.
 * Owner: backend
 */

/** Ticks a forward stays active (2 s at 20 Hz): far more than a gateway needs to see the welcome. */
const FORWARD_TICKS = 40;

export class InputForwarding {
  private readonly targets = new Map<string, { readonly cellKey: string; readonly untilTick: number }>();

  add(sessionId: string, cellKey: string, tick: number): void {
    this.targets.set(sessionId, { cellKey, untilTick: tick + FORWARD_TICKS });
  }

  /** Cell to forward this session's inputs to, if any. */
  targetOf(sessionId: string): string | null {
    return this.targets.get(sessionId)?.cellKey ?? null;
  }

  remove(sessionId: string): void {
    this.targets.delete(sessionId);
  }

  prune(tick: number): void {
    for (const [sessionId, target] of this.targets) if (target.untilTick < tick) this.targets.delete(sessionId);
  }
}
