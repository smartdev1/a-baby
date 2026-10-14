/**
 * Role: action state machine (ARCHITECTURE §15.2) as a pure reducer: requested → validated → reserved → running → completed → settled, with rejected, timeout, interrupted and failed; illegal transitions throw.
 * Owner: backend
 */

import type { Action, NeedId } from '@skyline/content-schema';
import { continuousDeltas, progressAt } from './action-ellipse.ts';
import { evaluateConditions, type Refusal } from './action-conditions.ts';
import type { ActorView, PlaceView } from './actor-view.ts';

export type RunState = 'requested' | 'validated' | 'rejected' | 'reserved' | 'running' | 'completed' | 'interrupted' | 'failed' | 'timeout' | 'settled';

export interface ActionRun {
  readonly requestId: string;
  readonly actionId: string;
  readonly characterId: string;
  readonly placeId: string;
  readonly state: RunState;
  readonly refusals: readonly Refusal[];
  readonly startedAtRealMs: number | null;
  /** Share of the action done (0–1); continuous effects were applied up to it. */
  readonly progress: number;
  /** State the run had before `settled` (completed, interrupted or failed). */
  readonly endedAs: RunState | null;
  readonly reason: string | null;
}

const NEXT: Readonly<Record<RunState, readonly RunState[]>> = {
  requested: ['validated', 'rejected'],
  validated: ['reserved', 'rejected'],
  reserved: ['running', 'timeout', 'interrupted'],
  running: ['completed', 'interrupted', 'failed'],
  completed: ['settled'],
  interrupted: ['settled'],
  failed: ['settled'],
  rejected: [],
  timeout: [],
  settled: [],
};

export class IllegalTransitionError extends Error {}

const move = (run: ActionRun, to: RunState, patch: Partial<ActionRun> = {}): ActionRun => {
  if (!NEXT[run.state].includes(to)) throw new IllegalTransitionError(`action ${run.requestId}: ${run.state} → ${to} is not allowed`);
  return { ...run, ...patch, state: to };
};

/** New request, validated at once against the authoritative views. */
export const requestRun = (input: { requestId: string; action: Action; actor: ActorView; place: PlaceView }): ActionRun => {
  const run: ActionRun = {
    requestId: input.requestId,
    actionId: input.action.id,
    characterId: input.actor.characterId,
    placeId: input.place.placeId,
    state: 'requested',
    refusals: [],
    startedAtRealMs: null,
    progress: 0,
    endedAs: null,
    reason: null,
  };
  const refusals = evaluateConditions(input.action, input.actor, input.place);
  return refusals.length > 0 ? move(run, 'rejected', { refusals }) : move(run, 'validated');
};

/** Site reserved (and payment pre-authorised) by the zone, or refused (site taken meanwhile). */
export const reserveRun = (run: ActionRun, reserved: boolean): ActionRun => (reserved ? move(run, 'reserved') : move(run, 'rejected', { refusals: [{ code: 'no_free_site' }] }));

export const startRun = (run: ActionRun, nowRealMs: number): ActionRun => move(run, 'running', { startedAtRealMs: nowRealMs });

export const timeoutRun = (run: ActionRun): ActionRun => move(run, 'timeout', { reason: 'reservation_timeout' });

/** Advances a running action (1 Hz): continuous need deltas since the last tick, completion at 100 %. */
export const tickRun = (run: ActionRun, action: Action, ratio: number, nowRealMs: number): { run: ActionRun; needDeltas: Partial<Record<NeedId, number>> } => {
  if (run.state !== 'running' || run.startedAtRealMs === null) return { run, needDeltas: {} };
  const progress = progressAt(action, ratio, nowRealMs - run.startedAtRealMs);
  const needDeltas = continuousDeltas(action, run.progress, progress);
  const advanced = { ...run, progress };
  return { run: progress >= 1 ? move(advanced, 'completed') : advanced, needDeltas };
};

/** Player cancel, walked away, disconnected > 60 s, place closed… */
export const interruptRun = (run: ActionRun, reason: string): ActionRun => move(run, 'interrupted', { reason });

export const failRun = (run: ActionRun, reason: string): ActionRun => move(run, 'failed', { reason });

export const markSettled = (run: ActionRun): ActionRun => move(run, 'settled', { endedAs: run.state });
