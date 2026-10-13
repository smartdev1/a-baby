/**
 * Role: Zod schemas of `content/game-config/clock.json` and `calendar.json` (validated game parameters, not code constants).
 * Owner: backend
 */

import { z } from 'zod';

export const ClockConfigSchema = z
  .object({
    /** Game minutes per real minute. 12 ⇒ 1 game day = 2 real hours (owner decision, ADR 0011). */
    ratio: z.number().positive().max(1440),
    /** Game time at the very first start of the world, minutes since game epoch (e.g. day 0, 06:00 = 360). */
    initialGameMin: z.number().min(0),
  })
  .strict();

export const CalendarConfigSchema = z
  .object({
    hoursPerDay: z.literal(24),
    weekdays: z.array(z.string().regex(/^calendar\.weekday\.[a-z]+$/)).length(7),
    monthDays: z.array(z.number().int().min(1).max(31)).min(1).max(24),
    firstWeekday: z.number().int().min(0).max(6),
    startYear: z.number().int(),
  })
  .strict();

export type ClockConfig = z.infer<typeof ClockConfigSchema>;
export type CalendarConfig = z.infer<typeof CalendarConfigSchema>;
