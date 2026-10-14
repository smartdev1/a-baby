/**
 * Role: Zod schemas of metered taxis (protocol v6, ARCHITECTURE §17.1): the client hails a taxi from a street towards a place; the server assigns one of the virtual fleet (ETA), picks the player up, drives the road route (accelerated) and charges pickup + distance, or refuses with reasons.
 * Owner: backend
 */

import { z } from 'zod';

const RequestIdSchema = z.string().regex(/^[A-Za-z0-9-]{8,64}$/);
const PlaceIdSchema = z.string().regex(/^osm:(node|way|relation)\/\d+$/).max(40);

export const TaxiRequestSchema = z.object({ requestId: RequestIdSchema, destinationPlaceId: PlaceIdSchema }).strict();

export const TAXI_STATES = ['rejected', 'assigned', 'boarded', 'arrived', 'cancelled'] as const;
export const TAXI_REFUSALS = ['no_road_nearby', 'unknown_place', 'no_route', 'unreachable', 'insufficient_funds', 'busy', 'missed', 'unavailable'] as const;

export const TaxiUpdateSchema = z
  .object({
    requestId: RequestIdSchema,
    destinationPlaceId: z.string().max(40),
    state: z.enum(TAXI_STATES),
    /** Real ms until the taxi arrives (assigned) or until the destination (boarded); 0 otherwise. */
    etaMs: z.number().int().min(0).max(300_000),
    /** Fare of the route (estimate when assigned, charged when boarded). */
    fareDjai: z.number().int().min(0).max(1_000_000),
    distanceM: z.number().int().min(0).max(100_000),
    refusals: z.array(z.object({ code: z.enum(TAXI_REFUSALS) }).strict()).max(4),
  })
  .strict();

export type TaxiRequestMessage = z.infer<typeof TaxiRequestSchema>;
export type TaxiUpdateMessage = z.infer<typeof TaxiUpdateSchema>;
export type TaxiRefusal = (typeof TAXI_REFUSALS)[number];
