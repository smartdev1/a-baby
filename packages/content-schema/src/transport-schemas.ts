/**
 * Role: schemas of transport content (ARCHITECTURE §17.2): service profiles per line mode `content/transport/services/<mode>.service.json` (visible speed, dwell, seats, flat fare, headway per period of the game day) and the metered taxi fare `content/transport/fares/taxi.fare.json`.
 * Owner: backend
 */

import { z } from 'zod';
import { GameTimeSchema, I18nKeySchema } from './content-ids.ts';

/** Line modes produced by the pipeline stage `08b-transit`. */
export const TRANSIT_MODES = ['gbaka', 'woro_woro', 'sotra_bus', 'bus'] as const;
export const TransitModeSchema = z.enum(TRANSIT_MODES);
export type TransitMode = z.infer<typeof TransitModeSchema>;

export const TransportServiceSchema = z
  .object({
    $schema: z.string().optional(),
    id: TransitModeSchema,
    version: z.number().int().positive(),
    labelKey: I18nKeySchema,
    /** Speed seen by players in real time (km/h); the timetable converts it with the nominal clock ratio. */
    cruiseKmh: z.number().min(5).max(80),
    /** Game minutes spent at each stop, terminuses included. */
    dwellGameMin: z.number().min(0).max(60),
    seats: z.number().int().min(1).max(120),
    fareDjai: z.number().int().nonnegative(),
    /** Headway over windows of the game day (a window may cross midnight); no service outside them. */
    periods: z.array(z.object({ from: GameTimeSchema, to: GameTimeSchema, headwayGameMin: z.number().int().min(1).max(240) }).strict()).min(1),
  })
  .strict();
export type TransportService = z.infer<typeof TransportServiceSchema>;

/** Metered taxi (taxi compteur): pickup + distance, ETA of the virtual fleet in game minutes. */
export const TaxiFareSchema = z
  .object({
    $schema: z.string().optional(),
    id: z.literal('taxi'),
    version: z.number().int().positive(),
    labelKey: I18nKeySchema,
    pickupDjai: z.number().int().nonnegative(),
    perKmDjai: z.number().int().nonnegative(),
    /** Speed seen by players in real time (km/h). */
    cruiseKmh: z.number().min(5).max(90),
    /** A taxi of the virtual fleet reaches the player after this many game minutes (deterministic per request). */
    etaGameMin: z.object({ min: z.number().min(0).max(60), max: z.number().min(0).max(60) }).strict().refine((e) => e.min <= e.max, 'min ≤ max'),
  })
  .strict();
export type TaxiFare = z.infer<typeof TaxiFareSchema>;
