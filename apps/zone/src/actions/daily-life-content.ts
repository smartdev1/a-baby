/**
 * Role: the daily-life content a zone needs (actions, place types, needs config), read from content/ and validated with @skyline/content-schema at start; an invalid file stops the zone.
 * Owner: backend
 */

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { type Action, ActionSchema, type NeedsConfig, NeedsConfigSchema, type PlaceType, PlaceTypeSchema } from '@skyline/content-schema';

export interface DailyLifeContent {
  readonly actions: ReadonlyMap<string, Action>;
  readonly placeTypes: ReadonlyMap<string, PlaceType>;
  readonly needs: NeedsConfig;
}

const filesWithSuffix = async (dir: string, suffix: string): Promise<string[]> => {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true }).catch(() => []);
  return entries
    .filter((e) => e.isFile() && e.name.endsWith(suffix))
    .map((e) => join(e.parentPath, e.name))
    .sort();
};

const parseFile = async <T>(file: string, parse: (json: unknown) => T): Promise<T> => {
  try {
    return parse(JSON.parse(await readFile(file, 'utf8')));
  } catch (error) {
    throw new Error(`invalid content file ${file}: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
  }
};

export const loadDailyLifeContent = async (contentDir: string): Promise<DailyLifeContent> => {
  const actions = await Promise.all((await filesWithSuffix(join(contentDir, 'actions'), '.action.json')).map((f) => parseFile(f, (j) => ActionSchema.parse(j))));
  const placeTypes = await Promise.all((await filesWithSuffix(join(contentDir, 'place-types'), '.place.json')).map((f) => parseFile(f, (j) => PlaceTypeSchema.parse(j))));
  const needs = await parseFile(join(contentDir, 'needs', 'needs.config.json'), (j) => NeedsConfigSchema.parse(j));
  return { actions: new Map(actions.map((a) => [a.id, a])), placeTypes: new Map(placeTypes.map((p) => [p.id, p])), needs };
};
