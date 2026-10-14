/**
 * Role: tests the deterministic tar.gz writer: same bytes on every run, valid ustar headers and checksums, contents read back after gunzip, neutral gzip OS byte.
 * Owner: backend
 */

import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ustarHeader, writeTarGz } from './deterministic-tar-gz.ts';

let dir = '';
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'tar-'));
});
afterEach(async () => rm(dir, { recursive: true, force: true }));

/** Minimal ustar reader: [name, content] of every entry. */
const readTar = (tar: Buffer): [string, string][] => {
  const out: [string, string][] = [];
  for (let at = 0; at + 512 <= tar.length; ) {
    const header = tar.subarray(at, at + 512);
    if (header.every((b) => b === 0)) break;
    const name = header.subarray(0, 100).toString('utf8').replace(/\0.*$/s, '');
    const size = parseInt(header.subarray(124, 135).toString('ascii'), 8);
    out.push([name, tar.subarray(at + 512, at + 512 + size).toString('utf8')]);
    at += 512 + Math.ceil(size / 512) * 512;
  }
  return out;
};

describe('writeTarGz', () => {
  it('should write the same bytes twice and read back every entry', async () => {
    await writeFile(join(dir, 'data.ndjson'), '{"a":1}\n{"a":2}\n');
    const entries = [
      { name: 'layer/README.md', source: { text: '# ODbL\n' } },
      { name: 'layer/data.ndjson', source: { path: join(dir, 'data.ndjson') } },
    ];
    await writeTarGz(join(dir, 'a.tar.gz'), entries, 1_790_000_000);
    await writeTarGz(join(dir, 'b.tar.gz'), entries, 1_790_000_000);
    const [a, b] = await Promise.all([readFile(join(dir, 'a.tar.gz')), readFile(join(dir, 'b.tar.gz'))]);
    expect(a.equals(b)).toBe(true);
    expect(a[9]).toBe(0xff);
    expect(readTar(gunzipSync(a))).toEqual([
      ['layer/README.md', '# ODbL\n'],
      ['layer/data.ndjson', '{"a":1}\n{"a":2}\n'],
    ]);
  });

  it('should write a valid ustar checksum and refuse long names', () => {
    const header = ustarHeader('x.txt', 5, 0);
    const stored = parseInt(header.subarray(148, 154).toString('ascii'), 8);
    const copy = Buffer.from(header);
    copy.fill(0x20, 148, 156);
    expect(stored).toBe(copy.reduce((s, b) => s + b, 0));
    expect(header.subarray(257, 262).toString('ascii')).toBe('ustar');
    expect(() => ustarHeader('a'.repeat(101), 1, 0)).toThrow(/100 bytes/);
  });
});
