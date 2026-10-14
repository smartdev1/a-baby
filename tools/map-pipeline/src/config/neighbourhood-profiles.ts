/**
 * Role: Zod schema and loader of a commune's neighbourhood height profiles (`config/<commune>.neighbourhoods.json`): level distributions or height ranges, and the OSM neighbourhood name → profile table.
 * Owner: backend
 */

import { readFile } from 'node:fs/promises';
import { z } from 'zod';

const Weighted = z.tuple([z.number().int().min(1).max(40), z.number().positive()]);

const ProfileSchema = z
  .object({
    note: z.string().optional(),
    /** [levels, weight] pairs. */
    levels: z.array(Weighted).min(1).optional(),
    /** Single volume height range in metres (industrial sheds). */
    heightM: z.tuple([z.number().positive(), z.number().positive()]).optional(),
  })
  .strict()
  .refine((p) => (p.levels === undefined) !== (p.heightM === undefined), 'a profile has either levels or heightM');

export const NeighbourhoodProfilesSchema = z
  .object({
    '//': z.string().optional(),
    /** Owner review (null until validated), like the brand parody table. */
    reviewedBy: z.string().nullable(),
    /** Neighbourhoods mapped as points apply up to this distance. */
    maxPointDistanceM: z.number().positive(),
    /** Smaller buildings (kiosks, sheds) keep the generic heuristic. */
    minFootprintM2: z.number().nonnegative(),
    profiles: z.record(z.string().regex(/^[a-z][a-z-]*$/), ProfileSchema),
    neighbourhoods: z.record(z.string().min(1), z.string()),
    /** [regular expression on the name key, profile], tried in order when the exact name is not listed. */
    patterns: z.array(z.tuple([z.string().min(1), z.string()])).default([]),
  })
  .strict()
  .superRefine((c, ctx) => {
    for (const [name, profile] of Object.entries(c.neighbourhoods)) {
      if (!c.profiles[profile]) ctx.addIssue({ code: 'custom', path: ['neighbourhoods', name], message: `unknown profile "${profile}"` });
    }
    c.patterns.forEach(([pattern, profile], k) => {
      if (!c.profiles[profile]) ctx.addIssue({ code: 'custom', path: ['patterns', k], message: `unknown profile "${profile}"` });
      try {
        new RegExp(pattern);
      } catch {
        ctx.addIssue({ code: 'custom', path: ['patterns', k], message: `invalid regular expression "${pattern}"` });
      }
    });
  });

export type NeighbourhoodProfiles = z.infer<typeof NeighbourhoodProfilesSchema>;
export type NeighbourhoodProfile = NeighbourhoodProfiles['profiles'][string];

export const loadNeighbourhoodProfiles = async (path: string): Promise<NeighbourhoodProfiles> =>
  NeighbourhoodProfilesSchema.parse(JSON.parse(await readFile(path, 'utf8')));

/** Accent-, case- and punctuation-insensitive key: "Port-Bouët II" → "port bouet ii". */
export const neighbourhoodKey = (name: string): string =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** Profile name of a neighbourhood: exact name first, then the first matching pattern; null when none applies. */
export const profileNameOf = (config: Pick<NeighbourhoodProfiles, 'neighbourhoods' | 'patterns'>, name: string): string | null => {
  const key = neighbourhoodKey(name);
  for (const [listed, profile] of Object.entries(config.neighbourhoods)) if (neighbourhoodKey(listed) === key) return profile;
  return config.patterns.find(([pattern]) => new RegExp(pattern).test(key))?.[1] ?? null;
};
