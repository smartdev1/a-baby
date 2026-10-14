/**
 * Role: settlement of an ended action in one idempotent result keyed `action:{requestId}`: cost legs, completion effects, drawn outcome, skill XP and cooldown, or the partial settlement of the action file when interrupted; a replayed request returns the first result.
 * Owner: backend
 */

import type { Action } from '@skyline/content-schema';
import { applyEffects, type EffectBatch, type EffectContext, emptyBatch } from './action-effects.ts';
import { type ActionRun, markSettled } from './action-run.ts';
import { drawWeighted } from './outcome-draw.ts';

export interface Settlement {
  readonly key: string;
  readonly requestId: string;
  readonly endedAs: 'completed' | 'interrupted' | 'failed';
  readonly batch: EffectBatch;
  /** Index of the drawn outcome (−1 when none). */
  readonly outcome: number;
  /** Cooldown to record (completed actions only). */
  readonly cooldown: { readonly scope: 'character' | 'place'; readonly untilGameMinute: number } | null;
}

export interface SettleInput {
  readonly run: ActionRun;
  readonly action: Action;
  readonly ctx: EffectContext;
  readonly gameMinute: number;
}

export const settlementKey = (requestId: string): string => `action:${requestId}`;

const costLegs = (action: Action, ctx: EffectContext, batch: EffectBatch): void => {
  const djai = action.cost?.djai.base ?? 0;
  if (djai <= 0 || !action.cost) return;
  batch.legs.push({ from: ctx.actorAccount, to: action.cost.payee === 'provider' ? ctx.providerAccount : 'system:sink', djai, reason: action.id });
};

const completedBatch = (action: Action, ctx: EffectContext, requestId: string): { batch: EffectBatch; outcome: number } => {
  const batch = emptyBatch();
  costLegs(action, ctx, batch);
  applyEffects(action.effects.onComplete, ctx, batch);
  const outcome = drawWeighted(action.outcomes.map((o) => o.weight), requestId);
  applyEffects(action.outcomes[outcome]?.effects ?? [], ctx, batch);
  for (const { skill, xp } of action.skills.grant) batch.skillXp.push({ skill, xp });
  return { batch, outcome };
};

/** Interrupted: the file decides; failed (server side): refunded, no effects. */
const partialBatch = (action: Action, ctx: EffectContext, endedAs: 'interrupted' | 'failed'): EffectBatch => {
  const batch = emptyBatch();
  if (endedAs === 'interrupted' && action.duration.onInterrupt !== 'refund_full_no_effects') costLegs(action, ctx, batch);
  return batch;
};

/** Pure settlement of an ended run (completed, interrupted or failed). */
export const settle = ({ run, action, ctx, gameMinute }: SettleInput): { run: ActionRun; settlement: Settlement } => {
  const endedAs = run.state;
  if (endedAs !== 'completed' && endedAs !== 'interrupted' && endedAs !== 'failed') throw new Error(`action ${run.requestId} cannot be settled from ${endedAs}`);
  const { batch, outcome } = endedAs === 'completed' ? completedBatch(action, ctx, run.requestId) : { batch: partialBatch(action, ctx, endedAs), outcome: -1 };
  const cd = action.requires.cooldown;
  const cooldown = endedAs === 'completed' && cd ? { scope: cd.scope, untilGameMinute: gameMinute + cd.gameMinutes } : null;
  return { run: markSettled(run), settlement: { key: settlementKey(run.requestId), requestId: run.requestId, endedAs, batch, outcome, cooldown } };
};

/**
 * In-memory idempotency of settlements (the zone's store until the EconomyPort persists them): the first result per key is kept
 * and returned again for a replayed request.
 */
export class SettlementStore {
  private readonly byKey = new Map<string, Settlement>();

  settleOnce(input: SettleInput): Settlement {
    const key = settlementKey(input.run.requestId);
    const known = this.byKey.get(key);
    if (known) return known;
    const { settlement } = settle(input);
    this.byKey.set(key, settlement);
    return settlement;
  }

  get size(): number {
    return this.byKey.size;
  }
}
