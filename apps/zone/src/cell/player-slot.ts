/**
 * Role: server-side state of one connected player in a cell: authoritative character state, bounded input queue, last processed sequence, violations.
 * Owner: backend
 */

import type { CharacterState, MoveInput } from '@skyline/physics';
import type { InputMessage } from '@skyline/protocol';

/** Inputs consumed per 20 Hz tick: a client cannot move faster by flooding inputs. */
export const MAX_INPUTS_PER_TICK = 2;
const MAX_QUEUED_INPUTS = 10;

export class PlayerSlot {
  private readonly queue: InputMessage[] = [];
  lastSeq = -1;
  violations = 0;
  lastInput: MoveInput = { moveX: 0, moveZ: 0, yawRad: 0, run: false, jump: false };

  constructor(
    readonly sessionId: string,
    readonly entityId: number,
    public state: CharacterState,
  ) {}

  /** Queues an input; replays (old seq) and floods are refused and counted. */
  offer(input: InputMessage): boolean {
    const lastQueued = this.queue.at(-1)?.seq ?? this.lastSeq;
    if (input.seq <= lastQueued || this.queue.length >= MAX_QUEUED_INPUTS) {
      this.violations++;
      return false;
    }
    this.queue.push(input);
    return true;
  }

  /** Inputs to simulate this tick (at most MAX_INPUTS_PER_TICK). */
  takeForTick(): InputMessage[] {
    return this.queue.splice(0, MAX_INPUTS_PER_TICK);
  }
}
