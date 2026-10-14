/**
 * Role: effect registry of the engine: each effect type has a handler that adds its result to an effect batch (need deltas, buffs, notifications, items, skill XP, economy legs); money handlers never touch a balance, they emit legs for the EconomyPort.
 * Owner: backend
 */

import type { Effect, EffectType, NeedId } from '@skyline/content-schema';

/** One debit/credit pair settled by the economy (ARCHITECTURE §18). */
export interface EconomyLeg {
  readonly from: string;
  readonly to: string;
  readonly djai: number;
  readonly reason: string;
}

export interface EffectBatch {
  readonly needDeltas: Partial<Record<NeedId, number>>;
  readonly buffs: { readonly buff: string; readonly gameMinutes: number }[];
  readonly notifications: { readonly key: string; readonly register: string }[];
  readonly items: { readonly item: string; readonly quantity: number }[];
  readonly skillXp: { readonly skill: string; readonly xp: number }[];
  readonly legs: EconomyLeg[];
}

/** Who the accounts of the economy legs are. */
export interface EffectContext {
  readonly actorAccount: string;
  readonly providerAccount: string;
  readonly actionId: string;
  readonly nearbyCharacters: number;
}

export const emptyBatch = (): EffectBatch => ({ needDeltas: {}, buffs: [], notifications: [], items: [], skillXp: [], legs: [] });

type Handler<T extends EffectType> = (effect: Extract<Effect, { type: T }>, batch: EffectBatch, ctx: EffectContext) => void;

const counterpartyAccount = (counterparty: string, ctx: EffectContext): string => (counterparty === 'provider' ? ctx.providerAccount : counterparty);

/** Open registry: a new effect type = its schema in content-schema + one handler here. */
export const EFFECT_HANDLERS: { readonly [T in EffectType]: Handler<T> } = {
  need: (e, b) => {
    b.needDeltas[e.need] = (b.needDeltas[e.need] ?? 0) + e.delta;
  },
  buff: (e, b) => {
    b.buffs.push({ buff: e.buff, gameMinutes: e.gameMinutes });
  },
  notification: (e, b) => {
    b.notifications.push({ key: e.key, register: e.register });
  },
  money: (e, b, ctx) => {
    const other = counterpartyAccount(e.counterparty, ctx);
    const [from, to] = e.direction === 'actor_pays' ? [ctx.actorAccount, other] : [other, ctx.actorAccount];
    b.legs.push({ from, to, djai: e.djai, reason: ctx.actionId });
  },
  skill_xp: (e, b) => {
    b.skillXp.push({ skill: e.skill, xp: e.xp });
  },
  item_add: (e, b) => {
    b.items.push({ item: e.item, quantity: e.quantity });
  },
  item_remove: (e, b) => {
    b.items.push({ item: e.item, quantity: -e.quantity });
  },
};

const guardPasses = (effect: Effect, ctx: EffectContext): boolean => !effect.if || ctx.nearbyCharacters >= effect.if.nearbyCharacters.min;

export const applyEffects = (effects: readonly Effect[], ctx: EffectContext, batch: EffectBatch = emptyBatch()): EffectBatch => {
  for (const effect of effects) {
    if (!guardPasses(effect, ctx)) continue;
    (EFFECT_HANDLERS[effect.type] as Handler<typeof effect.type>)(effect, batch, ctx);
  }
  return batch;
};
