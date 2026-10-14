/**
 * Role: compiles validated content into deterministic packs (one JSON per category, sorted by id, stable key order) and writes the JSON Schemas generated from Zod for editor autocompletion.
 * Owner: backend
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { CONTENT_SCHEMAS, type ContentKind, jsonSchemaOf } from '@skyline/content-schema';
import type { ValidContent } from './content-validation.ts';

/** JSON with object keys sorted at every level (same bytes for the same content). */
export const stableJson = (value: unknown): string =>
  JSON.stringify(value, (_key, v: unknown) => (v !== null && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => (a < b ? -1 : 1))) : v), 2);

const byId = <T extends { id: string }>(list: readonly T[]): T[] => [...list].sort((a, b) => (a.id < b.id ? -1 : 1));

export const writePacks = async (content: ValidContent, outDir: string): Promise<string[]> => {
  await mkdir(outDir, { recursive: true });
  const packs: [string, unknown][] = [
    ['actions.pack.json', byId(content.actions)],
    ['place-types.pack.json', byId(content.placeTypes)],
    ['jobs.pack.json', byId(content.jobs)],
    ['items.pack.json', byId(content.items)],
    ['transport-services.pack.json', byId(content.transportServices)],
    ['needs.pack.json', content.needs],
  ];
  for (const [name, value] of packs) await writeFile(join(outDir, name), `${stableJson(value)}\n`);
  return packs.map(([name]) => name);
};

export const writeJsonSchemas = async (outDir: string): Promise<string[]> => {
  await mkdir(outDir, { recursive: true });
  const kinds = Object.keys(CONTENT_SCHEMAS) as ContentKind[];
  for (const kind of kinds) await writeFile(join(outDir, `${kind}.schema.json`), `${stableJson(jsonSchemaOf(kind))}\n`);
  return kinds.map((k) => `${k}.schema.json`);
};
