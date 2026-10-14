/**
 * Role: Zod schemas of line rides (protocol v4, ARCHITECTURE §17.3): the client asks to board the vehicle docked at the nearby stop of a line towards a later stop (accelerated travel); the server answers boarded / arrived or rejected with reasons.
 * Owner: backend
 */

import { z } from 'zod';

const RequestIdSchema = z.string().regex(/^[A-Za-z0-9-]{8,64}$/);

export const RideRequestSchema = z
  .object({
    /** Client-made UUID, idempotency key of the fare (`fare:{characterId}:{requestId}`). */
    requestId: RequestIdSchema,
    /** OSM relation id of the line (pipeline stage `08b-transit`). */
    lineId: z.string().regex(/^osm:relation\/\d+$/).max(40),
    toStopId: z.string().regex(/^osm:node\/\d+$/).max(40),
  })
  .strict();

export const RIDE_STATES = ['rejected', 'boarded', 'arrived'] as const;
export const RIDE_REFUSALS = ['unknown_line', 'no_stop_nearby', 'wrong_direction', 'no_vehicle', 'full', 'unreachable', 'insufficient_funds', 'already_riding', 'unavailable'] as const;

export const RideUpdateSchema = z
  .object({
    requestId: RequestIdSchema,
    lineId: z.string().max(40),
    toStopId: z.string().max(40),
    state: z.enum(RIDE_STATES),
    fareDjai: z.number().int().min(0).max(1_000_000),
    /** Real milliseconds until arrival (boarded), 0 otherwise. */
    arriveInMs: z.number().int().min(0).max(120_000),
    /** Why the ride was refused; `no_vehicle` gives the next arrival at the stop in game minutes when known. */
    refusals: z.array(z.object({ code: z.enum(RIDE_REFUSALS), nextInGameMin: z.number().min(0).max(2880).optional() }).strict()).max(4),
  })
  .strict();

export type RideRequestMessage = z.infer<typeof RideRequestSchema>;
export type RideUpdateMessage = z.infer<typeof RideUpdateSchema>;
export type RideRefusal = (typeof RIDE_REFUSALS)[number];
