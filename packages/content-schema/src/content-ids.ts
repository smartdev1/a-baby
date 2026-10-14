/**
 * Role: shared building blocks of content schemas: content ids (`category.name_snake`), i18n keys, game times (`HH:MM`) and game-time windows.
 * Owner: backend
 */

import { z } from 'zod';

/** `food.eat_garba`, `garba_stand`… lower snake case segments separated by dots. */
export const ContentIdSchema = z.string().regex(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$/, 'expected a lower snake_case id (segments separated by dots)');

/** `action.food.eat_garba.label` */
export const I18nKeySchema = z.string().regex(/^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/, 'expected an i18n key like action.food.eat_garba.label');

/** Game time of day `HH:MM` (00:00 – 24:00). */
export const GameTimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$|^24:00$/, 'expected HH:MM in game time');

/** A window may cross midnight (`22:00` → `06:00`). */
export const TimeWindowSchema = z.object({ from: GameTimeSchema, to: GameTimeSchema }).strict();

export const NEEDS = ['hunger', 'energy', 'hygiene', 'social', 'fun'] as const;
export const NeedIdSchema = z.enum(NEEDS);
export type NeedId = z.infer<typeof NeedIdSchema>;

export const GameMinutesSchema = z.number().int().nonnegative().max(60 * 24 * 28);
