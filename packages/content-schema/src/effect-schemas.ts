/**
 * Role: schemas of action effects (registry of ARCHITECTURE §15.4, MVP set): needs, buffs, notifications, money legs, skills and items; a new effect type = one entry here and one handler in sim-actions.
 * Owner: backend
 */

import { z } from 'zod';
import { ContentIdSchema, GameMinutesSchema, I18nKeySchema, NeedIdSchema } from './content-ids.ts';

/** Optional guard of an effect (`social +5 if someone is near`). */
export const EffectGuardSchema = z.object({ nearbyCharacters: z.object({ min: z.number().int().min(1) }).strict() }).strict();

const guarded = <T extends z.ZodRawShape>(shape: T) => z.object({ ...shape, if: EffectGuardSchema.optional() }).strict();

export const NeedEffectSchema = guarded({ type: z.literal('need'), need: NeedIdSchema, delta: z.number().min(-100).max(100) });
export const BuffEffectSchema = guarded({ type: z.literal('buff'), buff: ContentIdSchema, gameMinutes: GameMinutesSchema });
export const NotificationEffectSchema = guarded({ type: z.literal('notification'), key: I18nKeySchema, register: z.enum(['standard', 'nouchi']).default('standard') });
/** Money moves only through economy legs settled by the EconomyPort (never a balance write). */
export const MoneyEffectSchema = guarded({
  type: z.literal('money'),
  djai: z.number().int().positive(),
  direction: z.enum(['actor_pays', 'actor_earns']),
  /** Other side of the leg: the provider of the action or a system account. */
  counterparty: z.enum(['provider', 'system:wages', 'system:sink', 'system:faucet']),
});
export const SkillXpEffectSchema = guarded({ type: z.literal('skill_xp'), skill: ContentIdSchema, xp: z.number().int().positive() });
export const ItemAddEffectSchema = guarded({ type: z.literal('item_add'), item: ContentIdSchema, quantity: z.number().int().positive() });
export const ItemRemoveEffectSchema = guarded({ type: z.literal('item_remove'), item: ContentIdSchema, quantity: z.number().int().positive() });

export const EffectSchema = z.discriminatedUnion('type', [
  NeedEffectSchema,
  BuffEffectSchema,
  NotificationEffectSchema,
  MoneyEffectSchema,
  SkillXpEffectSchema,
  ItemAddEffectSchema,
  ItemRemoveEffectSchema,
]);

export type Effect = z.infer<typeof EffectSchema>;
export type EffectType = Effect['type'];
export const EFFECT_TYPES = EffectSchema.options.map((o) => o.shape.type.value);
