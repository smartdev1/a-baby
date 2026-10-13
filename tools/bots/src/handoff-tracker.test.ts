/**
 * Role: tests the client-side handoff measurement: gap and jump computed in absolute coordinates across two cell frames.
 * Owner: backend
 */

import { describe, expect, it } from 'vitest';
import { HandoffTracker } from './handoff-tracker.ts';

const welcome = (cellKey: string, eastingM: number) => ({ protocolVersion: 1, playerEntityId: 1, tickRateHz: 20, cellKey, frameOrigin: { eastingM, northingM: 589_000 } });
const ack = (x: number) => ({ lastSeq: 1, tick: 1, position: { x, y: 0, z: 300 }, velocity: { x: 6, y: 0, z: 0 } });

describe('HandoffTracker', () => {
  it('should measure a seamless handoff as a small gap and no jump', () => {
    const t = new HandoffTracker();
    t.onWelcome(welcome('C_81_49', 381_000));
    t.onAck(ack(999.7), 1000);
    t.onWelcome(welcome('C_82_49', 382_000));
    t.onAck(ack(0.6), 1100);
    expect(t.samples).toHaveLength(1);
    expect(t.samples[0]?.ackGapMs).toBe(100);
    expect(t.samples[0]?.jumpM).toBeCloseTo(0.3, 5);
  });

  it('should ignore the first welcome', () => {
    const t = new HandoffTracker();
    t.onWelcome(welcome('C_81_49', 381_000));
    t.onAck(ack(10), 0);
    expect(t.samples).toHaveLength(0);
  });
});
