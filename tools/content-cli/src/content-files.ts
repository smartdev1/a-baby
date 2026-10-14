/**
 * Role: finds and reads the content files of a content folder by kind (actions, place types, jobs, items, needs config, i18n catalogues), as raw JSON with their repository-relative paths.
 * Owner: backend
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import type { ContentKind } from '@skyline/content-schema';

export interface ContentFile {
  readonly kind: ContentKind;
  /** Path relative to the content folder, with `/`. */
  readonly path: string;
  readonly json: unknown;
}

const KIND_BY_SUFFIX: readonly (readonly [string, ContentKind])[] = [
  ['.action.json', 'action'],
  ['.place.json', 'place-type'],
  ['.job.json', 'job'],
  ['.item.json', 'item'],
];

const walk = async (dir: string): Promise<string[]> => {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const nested = await Promise.all(entries.map(async (e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)])));
  return nested.flat().sort();
};

const posix = (root: string, file: string): string => relative(root, file).split(sep).join('/');

export class ContentParseError extends Error {}

const readJson = async (file: string, shownAs: string): Promise<unknown> => {
  try {
    return JSON.parse(await readFile(file, 'utf8')) as unknown;
  } catch (error) {
    throw new ContentParseError(`${shownAs}: invalid JSON (${error instanceof Error ? error.message : String(error)})`);
  }
};

export const readContentFiles = async (contentDir: string): Promise<ContentFile[]> => {
  const files: ContentFile[] = [];
  for (const file of await walk(contentDir)) {
    const path = posix(contentDir, file);
    const kind = path === 'needs/needs.config.json' ? 'needs' : KIND_BY_SUFFIX.find(([suffix]) => path.endsWith(suffix))?.[1];
    if (kind) files.push({ kind, path, json: await readJson(file, path) });
  }
  return files;
};

/** Every key of the i18n catalogues `i18n/<locale>/*.json` (nested objects flattened with dots), by locale. */
export const readI18nKeys = async (contentDir: string): Promise<Map<string, Set<string>>> => {
  const byLocale = new Map<string, Set<string>>();
  const flatten = (value: unknown, prefix: string, out: Set<string>): void => {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      for (const [k, v] of Object.entries(value)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
    } else if (prefix) out.add(prefix);
  };
  for (const file of await walk(join(contentDir, 'i18n'))) {
    if (!file.endsWith('.json')) continue;
    const locale = posix(join(contentDir, 'i18n'), file).split('/')[0] ?? '';
    const keys = byLocale.get(locale) ?? new Set<string>();
    flatten(await readJson(file, posix(contentDir, file)), '', keys);
    byLocale.set(locale, keys);
  }
  return byLocale;
};
