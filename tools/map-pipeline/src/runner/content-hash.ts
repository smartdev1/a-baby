/**
 * Role: deterministic hashing helpers for the incremental runner: sha256 of files and of key-sorted JSON values.
 * Owner: backend
 */

import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

export const sha256OfFile = async (path: string): Promise<string> =>
  createHash('sha256')
    .update(await readFile(path))
    .digest('hex');

export const sha256OfText = (text: string): string => createHash('sha256').update(text).digest('hex');

/** JSON.stringify with object keys sorted recursively, so equal values always hash the same. */
export const stableStringify = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
};
