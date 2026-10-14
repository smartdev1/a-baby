/**
 * Role: schema of transport service profiles `content/transport/services/<mode>.service.json` (ARCHITECTURE §17.2): visible speed, dwell, seats, flat fare and headway per period of the game day, one per line mode.
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
