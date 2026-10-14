/**
 * Role: schema of an action file `content/actions/<category>/<id>.action.json` (ARCHITECTURE §15.3): where, when, requirements, cost, duration with ellipse, phases, effects, weighted outcomes, participants and provider.
 * Owner: backend
 */

import { z } from 'zod';
import { ContentIdSchema, GameMinutesSchema, I18nKeySchema, NeedIdSchema, TimeWindowSchema } from './content-ids.ts';
import { EffectSchema } from './effect-schemas.ts';

export const ACTOR_STATES = ['on_foot', 'not_in_action', 'in_vehicle', 'at_home', 'on_shift'] as const;

const WhereSchema = z
  .object({
    placeTypes: z.array(ContentIdSchema).min(1),
    /** Site kind reserved on the place (`seat_or_counter`, `bed`, `chair`…). */
    site: ContentIdSchema,
    interactionRadiusM: z.number().positive().max(50),
  })
  .strict();

const WhenSchema = z
  .object({
    /** `place`: the place's opening hours apply too. */
    openingHoursFrom: z.enum(['place', 'none']).default('place'),
    windows: z.array(TimeWindowSchema).default([]),
  })
  .strict();

const NeedBoundsSchema = z.object({ min: z.number().min(0).max(100).optional(), max: z.number().min(0).max(100).optional() }).strict();

const RequiresSchema = z
  .object({
    needs: z.partialRecord(NeedIdSchema, NeedBoundsSchema).default({}),
    money: z.object({ minDjai: z.number().int().nonnegative() }).strict().optional(),
    state: z.array(z.enum(ACTOR_STATES)).default([]),
    cooldown: z.object({ gameMinutes: GameMinutesSchema, scope: z.enum(['character', 'place']) }).strict().optional(),
    nearbyCharacters: z.object({ min: z.number().int().min(1) }).strict().optional(),
  })
  .strict();

const CostSchema = z
  .object({
    djai: z
      .object({
        base: z.number().int().nonnegative(),
        priceSource: z.enum(['base', 'business_price_list_or_base']).default('base'),
        priceModifiers: z.array(ContentIdSchema).default([]),
      })
      .strict(),
    payee: z.enum(['provider', 'system']),
  })
  .strict();

export const INTERRUPT_SETTLEMENTS = ['refund_none_partial_effects', 'refund_full_no_effects', 'refund_none_no_effects'] as const;

const DurationSchema = z
  .object({
    gameMinutes: z.number().int().positive().max(60 * 24),
    /** Ellipse: real duration cap of a long action (game effects still apply in full). */
    real: z.object({ maxSeconds: z.number().int().positive().max(1800) }).strict(),
    interruptible: z.boolean(),
    onInterrupt: z.enum(INTERRUPT_SETTLEMENTS),
  })
  .strict();

const PhaseSchema = z
  .object({
    id: ContentIdSchema,
    animation: ContentIdSchema,
    realSeconds: z.number().positive().max(120).optional(),
    loop: z.boolean().default(false),
    props: z.array(z.object({ id: ContentIdSchema, attach: z.string().min(1) }).strict()).default([]),
  })
  .strict();

/** Continuous effects run at 1 Hz while running (e.g. energy while sleeping), per game hour. */
const ContinuousEffectSchema = z.object({ type: z.literal('need'), need: NeedIdSchema, deltaPerGameHour: z.number().min(-100).max(100) }).strict();

export const ActionSchema = z
  .object({
    $schema: z.string().optional(),
    id: ContentIdSchema,
    version: z.number().int().positive(),
    category: ContentIdSchema,
    labelKey: I18nKeySchema,
    descriptionKey: I18nKeySchema.optional(),
    icon: ContentIdSchema.optional(),
    tags: z.array(ContentIdSchema).default([]),
    where: WhereSchema,
    when: WhenSchema.default({ openingHoursFrom: 'place', windows: [] }),
    requires: RequiresSchema.default({ needs: {}, state: [] }),
    cost: CostSchema.optional(),
    duration: DurationSchema,
    phases: z.array(PhaseSchema).default([]),
    effects: z.object({ onComplete: z.array(EffectSchema).default([]), continuous: z.array(ContinuousEffectSchema).default([]) }).strict(),
    outcomes: z.array(z.object({ weight: z.number().positive(), effects: z.array(EffectSchema) }).strict()).default([]),
    skills: z.object({ grant: z.array(z.object({ skill: ContentIdSchema, xp: z.number().int().positive() }).strict()).default([]) }).strict().default({ grant: [] }),
    participants: z
      .object({
        mode: z.enum(['solo', 'group']),
        min: z.number().int().min(1).optional(),
        max: z.number().int().min(1).max(22).optional(),
        npcRoles: z.array(z.object({ role: ContentIdSchema, required: z.boolean() }).strict()).default([]),
      })
      .strict()
      .default({ mode: 'solo', npcRoles: [] }),
    provider: z
      .object({ kind: z.enum(['place', 'system', 'job', 'player_business']), allowPlayerBusiness: z.boolean().default(false), employeeRole: ContentIdSchema.optional() })
      .strict()
      .default({ kind: 'system', allowPlayerBusiness: false }),
    /** v2 hooks (legality, missions…), kept opaque to the MVP engine. */
    extensions: z.record(z.string(), z.unknown()).default({}),
  })
  .strict()
  .superRefine((a, ctx) => {
    if (!a.id.startsWith(`${a.category}.`)) ctx.addIssue({ code: 'custom', path: ['id'], message: `id must start with its category "${a.category}."` });
    if (a.cost && a.cost.djai.base > 0 && !a.requires.money) ctx.addIssue({ code: 'custom', path: ['requires', 'money'], message: 'an action with a cost must require money' });
    const { min, max } = a.participants;
    if (min !== undefined && max !== undefined && min > max) ctx.addIssue({ code: 'custom', path: ['participants'], message: 'min > max' });
  });

export type Action = z.infer<typeof ActionSchema>;
export type ActionInput = z.input<typeof ActionSchema>;
export type InterruptSettlement = (typeof INTERRUPT_SETTLEMENTS)[number];
