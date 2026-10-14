/**
 * Role: schema of `content/needs/needs.config.json`: per need, start value, decay per game hour and penalties when the need is empty (ARCHITECTURE §16.2).
 * Owner: backend
 */

import { z } from 'zod';
import { NeedIdSchema, NEEDS } from './content-ids.ts';

/** What an empty need does to the character. */
export const NeedPenaltySchema = z.enum(['slow_walk', 'no_work_actions', 'no_sport_actions', 'social_refusals']);

export const NeedRuleSchema = z
  .object({
    start: z.number().min(0).max(100),
    /** Points lost per game hour while connected. */
    decayPerGameHour: z.number().min(0).max(100),
    /** Below this value the HUD warns. */
    warnBelow: z.number().min(0).max(100),
    penaltiesAtZero: z.array(NeedPenaltySchema),
  })
  .strict();

export const NeedsConfigSchema = z
  .object({
    $schema: z.string().optional(),
    version: z.number().int().positive(),
    needs: z.record(NeedIdSchema, NeedRuleSchema),
  })
  .strict()
  .superRefine((c, ctx) => {
    for (const need of NEEDS) if (!c.needs[need]) ctx.addIssue({ code: 'custom', path: ['needs', need], message: `missing need "${need}"` });
  });

export type NeedRule = z.infer<typeof NeedRuleSchema>;
export type NeedsConfig = z.infer<typeof NeedsConfigSchema>;
export type NeedPenalty = z.infer<typeof NeedPenaltySchema>;
