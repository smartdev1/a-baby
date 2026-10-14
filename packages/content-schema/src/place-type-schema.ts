/**
 * Role: schema of a place type `content/place-types/<id>.place.json`: the OSM game categories it covers, its action sites (kind, capacity, placement), opening hours in game time, NPC roles and sanctuary flag.
 * Owner: backend
 */

import { z } from 'zod';
import { ContentIdSchema, I18nKeySchema, TimeWindowSchema } from './content-ids.ts';

export const SITE_PLACEMENTS = ['inside', 'front', 'around'] as const;

export const PlaceTypeSchema = z
  .object({
    $schema: z.string().optional(),
    id: ContentIdSchema,
    version: z.number().int().positive(),
    labelKey: I18nKeySchema,
    /** Game place categories of the map pipeline (`food.maquis`, `commerce.kiosk`…). */
    osmCategories: z.array(z.string().regex(/^[a-z_]+\.[a-z_]+$/)).min(1),
    sites: z
      .array(
        z
          .object({
            kind: ContentIdSchema,
            capacity: z.number().int().min(1).max(50),
            /** inside the building footprint, in front of it (street side) or around a street place. */
            placement: z.enum(SITE_PLACEMENTS),
          })
          .strict(),
      )
      .min(1),
    /** Empty = open 24/24. */
    openingHours: z.array(TimeWindowSchema).default([]),
    npcRoles: z.array(ContentIdSchema).default([]),
    /** No "illegal" action ever possible here, even in v2 (places of worship). */
    sanctuary: z.boolean().default(false),
  })
  .strict();

export type PlaceType = z.infer<typeof PlaceTypeSchema>;
export type SitePlacement = (typeof SITE_PLACEMENTS)[number];
