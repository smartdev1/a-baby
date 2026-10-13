/**
 * Role: loads and validates the naming content (content/place-names: brand parodies, generic words, offensive words, per-object overrides).
 * Owner: backend
 */

import { readdirSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import { BrandParodies } from './brand-parody.ts';
import { foldText } from './name-text.ts';
import type { NamingRules } from './name-place.ts';

const ParodiesSchema = z.object({ reviewedBy: z.string().nullable(), note: z.string(), parodies: z.record(z.string().min(1), z.string().min(1)) });
const WordsSchema = z.object({ note: z.string(), words: z.array(z.string().min(1)) });
const OverrideSchema = z.object({ note: z.string().optional(), id: z.string().regex(/^osm:(node|way|relation)\/\d+$/), displayName: z.string().max(120).nullable(), reason: z.string().min(1) });

const readJson = async (path: string): Promise<unknown> => JSON.parse(await readFile(path, 'utf8'));

/** Content files read by the naming stage (declared as stage inputs). */
export const namingContentFiles = (dir: string): string[] => [
  join(dir, 'brand-parodies.json'),
  join(dir, 'generic-words.json'),
  join(dir, 'offensive-words.json'),
  ...readdirSync(join(dir, 'overrides'))
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => join(dir, 'overrides', f)),
];

export const loadNamingRules = async (dir: string, seed: string): Promise<NamingRules> => {
  const parodies = ParodiesSchema.parse(await readJson(join(dir, 'brand-parodies.json')));
  const generic = WordsSchema.parse(await readJson(join(dir, 'generic-words.json')));
  const offensive = WordsSchema.parse(await readJson(join(dir, 'offensive-words.json')));
  const overrides = new Map<string, string | null>();
  for (const file of namingContentFiles(dir).filter((f) => f.includes(`${join('overrides', '')}`))) {
    const o = OverrideSchema.parse(await readJson(file));
    overrides.set(o.id, o.displayName);
  }
  return {
    seed,
    brands: new BrandParodies(parodies.parodies),
    genericWords: new Set(generic.words.map(foldText)),
    offensiveWords: new Set(offensive.words.map(foldText)),
    overrides,
  };
};
