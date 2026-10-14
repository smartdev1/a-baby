/**
 * Role: schemas of NPC jobs `content/jobs/<id>.job.json` (employer place types, shifts in game time, work action, wage, anti-farm cap, levels) and items `content/items/<category>/<id>.item.json`.
 * Owner: backend
 */

import { z } from 'zod';
import { ContentIdSchema, I18nKeySchema, TimeWindowSchema } from './content-ids.ts';

export const JobSchema = z
  .object({
    $schema: z.string().optional(),
    id: ContentIdSchema,
    version: z.number().int().positive(),
    labelKey: I18nKeySchema,
    employerPlaceTypes: z.array(ContentIdSchema).min(1),
    /** Shifts in game time (day and night variants). */
    shifts: z.array(TimeWindowSchema).min(1),
    /** The action played during a shift. */
    workAction: ContentIdSchema,
    wagePerShiftDjai: z.number().int().positive(),
    /** Anti-farm: paid shifts per game day. */
    maxPaidShiftsPerGameDay: z.number().int().min(1).max(3),
    levels: z.array(z.object({ level: z.number().int().min(1), minShifts: z.number().int().nonnegative(), wageBonusPercent: z.number().min(0).max(200) }).strict()).min(1),
  })
  .strict();

export const ItemSchema = z
  .object({
    $schema: z.string().optional(),
    id: ContentIdSchema,
    version: z.number().int().positive(),
    labelKey: I18nKeySchema,
    category: ContentIdSchema,
    stackable: z.boolean(),
    maxStack: z.number().int().min(1).max(999),
    basePriceDjai: z.number().int().nonnegative().optional(),
  })
  .strict()
  .refine((i) => i.stackable || i.maxStack === 1, 'a non-stackable item has maxStack 1');

export type Job = z.infer<typeof JobSchema>;
export type Item = z.infer<typeof ItemSchema>;
