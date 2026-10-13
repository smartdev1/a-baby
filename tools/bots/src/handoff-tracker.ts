/**
 * Role: client-side view of cell handoffs: from welcomes and acks, measures the ack gap around each handoff and the position jump (in absolute UTM) left after removing the expected travel.
 * Owner: backend
 */

import type { ServerMessage } from '@skyline/protocol';

type Welcome = Extract<ServerMessage, { type: 'welcome' }>['body'];
type Ack = Extract<ServerMessage, { type: 'inputAck' }>['body'];

export interface HandoffSample {
  readonly toCell: string;
  /** Time between the last ack of the old cell and the first ack of the new one. */
  readonly ackGapMs: number;
  /** Distance between the extrapolated and the received absolute position. */
  readonly jumpM: number;
}

interface AbsoluteAck {
  readonly e: number;
  readonly n: number;
  readonly ve: number;
  readonly vn: number;
  readonly atMs: number;
}

export class HandoffTracker {
  readonly samples: HandoffSample[] = [];
  private frame: Welcome['frameOrigin'] | null = null;
  private cellKey: string | null = null;
  private lastAck: AbsoluteAck | null = null;
  private pending: AbsoluteAck | null = null;

  onWelcome(body: Welcome): void {
    if (this.cellKey !== null && body.cellKey !== this.cellKey) this.pending = this.lastAck;
    this.cellKey = body.cellKey;
    this.frame = body.frameOrigin;
  }

  onAck(body: Ack, nowMs: number): void {
    if (!this.frame) return;
    const ack: AbsoluteAck = { e: this.frame.eastingM + body.position.x, n: this.frame.northingM + body.position.z, ve: body.velocity.x, vn: body.velocity.z, atMs: nowMs };
    if (this.pending && this.cellKey) {
      const dt = (nowMs - this.pending.atMs) / 1000;
      const jumpM = Math.hypot(ack.e - (this.pending.e + this.pending.ve * dt), ack.n - (this.pending.n + this.pending.vn * dt));
      this.samples.push({ toCell: this.cellKey, ackGapMs: nowMs - this.pending.atMs, jumpM });
      this.pending = null;
    }
    this.lastAck = ack;
  }
}
