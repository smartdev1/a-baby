/**
 * Role: daily-life state of one player in a cell: needs snapshot, confirmed Djai, cooldowns, buffs, the running action with its reserved site, the last update of every request (replays), and a queue that serialises the player's requests.
 * Owner: backend
 */

import type { Action } from '@skyline/content-schema';
import type { ActionUpdateMessage } from '@skyline/protocol';
import { type ActionRun, SettlementStore } from '@skyline/sim-actions';
import type { NeedsSnapshot } from '@skyline/sim-needs';
import type { CellPlace, CellSite } from '../world-data/cell-places-loader.ts';

export interface RunningAction {
  run: ActionRun;
  readonly action: Action;
  readonly place: CellPlace;
  readonly site: CellSite;
}

export class PlayerLife {
  needs: NeedsSnapshot;
  djai = 0;
  readonly cooldowns = new Map<string, number>();
  readonly buffs = new Map<string, number>();
  running: RunningAction | null = null;
  /** Settlements of this character only: request ids are scoped per character (another player reusing an id gets nothing). */
  readonly settlements = new SettlementStore();
  /** Last update sent per request id: a replayed request gets it again (idempotency at the zone). */
  readonly updates = new Map<string, ActionUpdateMessage>();
  lastNeedsSent = '';
  private queue: Promise<void> = Promise.resolve();

  constructor(
    readonly sessionId: string,
    readonly characterId: string,
    needs: NeedsSnapshot,
  ) {
    this.needs = needs;
  }

  /** Idempotency key of a request in the ledger and the site reservations, scoped to the character. */
  scoped(requestId: string): string {
    return `${this.characterId}:${requestId}`;
  }

  /** Runs `task` after the player's previous tasks (requests never interleave). */
  serial(task: () => Promise<void>): Promise<void> {
    this.queue = this.queue.then(task, task);
    return this.queue;
  }

  remember(update: ActionUpdateMessage): void {
    this.updates.set(update.requestId, update);
    // Bounded memory: keep the last 64 requests.
    if (this.updates.size > 64) this.updates.delete(this.updates.keys().next().value ?? '');
  }
}
