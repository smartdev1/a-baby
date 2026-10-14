/**
 * Role: writes a .tar.gz archive with byte-identical output on every machine: ustar entries in the given order, fixed mtime, uid/gid 0, mode 0644, file contents streamed, gzip header OS byte neutralised.
 * Owner: backend
 */

import { createReadStream, createWriteStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createGzip } from 'node:zlib';

export interface TarEntry {
  /** Path inside the archive (≤ 100 bytes, `/` separators). */
  readonly name: string;
  /** Source file on disk, or literal content. */
  readonly source: { readonly path: string } | { readonly text: string };
}

const BLOCK = 512;

const field = (header: Buffer, offset: number, length: number, value: string): void => {
  header.write(value, offset, Math.min(length, Buffer.byteLength(value)), 'utf8');
};
const octal = (value: number, length: number): string => `${value.toString(8).padStart(length - 1, '0')}\0`;

export const ustarHeader = (name: string, size: number, mtimeS: number): Buffer => {
  if (Buffer.byteLength(name) > 100) throw new Error(`tar entry name longer than 100 bytes: ${name}`);
  const header = Buffer.alloc(BLOCK);
  field(header, 0, 100, name);
  field(header, 100, 8, octal(0o644, 8));
  field(header, 108, 8, octal(0, 8));
  field(header, 116, 8, octal(0, 8));
  field(header, 124, 12, octal(size, 12));
  field(header, 136, 12, octal(mtimeS, 12));
  field(header, 148, 8, '        ');
  field(header, 156, 1, '0');
  field(header, 257, 6, 'ustar\0');
  field(header, 263, 2, '00');
  let sum = 0;
  for (const byte of header) sum += byte;
  field(header, 148, 8, `${sum.toString(8).padStart(6, '0')}\0 `);
  return header;
};

const padding = (size: number): Buffer => Buffer.alloc((BLOCK - (size % BLOCK)) % BLOCK);

async function* tarStream(entries: readonly TarEntry[], mtimeS: number): AsyncGenerator<Buffer> {
  for (const entry of entries) {
    if ('text' in entry.source) {
      const body = Buffer.from(entry.source.text, 'utf8');
      yield ustarHeader(entry.name, body.length, mtimeS);
      yield body;
      yield padding(body.length);
      continue;
    }
    const { size } = await stat(entry.source.path);
    yield ustarHeader(entry.name, size, mtimeS);
    for await (const chunk of createReadStream(entry.source.path)) yield chunk as Buffer;
    yield padding(size);
  }
  yield Buffer.alloc(BLOCK * 2);
}

/** gzip writes the producing OS in byte 9 of its header: set it to 255 ("unknown") so archives match across platforms. */
const neutralOsByte = (): Transform => {
  let first = true;
  return new Transform({
    transform(chunk: Buffer, _encoding, done) {
      if (first && chunk.length > 9) {
        chunk[9] = 0xff;
        first = false;
      }
      done(null, chunk);
    },
  });
};

export const writeTarGz = async (outPath: string, entries: readonly TarEntry[], mtimeS: number): Promise<void> => {
  await pipeline(tarStream(entries, mtimeS), createGzip({ level: 9 }), neutralOsByte(), createWriteStream(outPath));
};
