/**
 * Role: streaming read and buffered write of newline-delimited JSON files (constant memory on a whole commune, deterministic output).
 * Owner: backend
 */

import { createReadStream, createWriteStream } from 'node:fs';
import { once } from 'node:events';
import { createInterface } from 'node:readline';

export async function* readNdjson<T>(path: string): AsyncGenerator<T> {
  const lines = createInterface({ input: createReadStream(path, 'utf8'), crlfDelay: Infinity });
  for await (const line of lines) {
    if (line.trim()) yield JSON.parse(line) as T;
  }
}

/** Writes one JSON value per line, respecting stream back-pressure. */
export const writeNdjson = async <T>(path: string, values: AsyncIterable<T> | Iterable<T>): Promise<number> => {
  const out = createWriteStream(path, 'utf8');
  let count = 0;
  for await (const value of values) {
    if (!out.write(`${JSON.stringify(value)}\n`)) await once(out, 'drain');
    count++;
  }
  out.end();
  await once(out, 'finish');
  return count;
};
