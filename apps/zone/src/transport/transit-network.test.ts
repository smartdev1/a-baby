/**
 * Role: tests the transit network loader: pipeline lines + the repository's service profiles → timetables (seats and fare of the mode), lines of a mode without profile skipped, missing pipeline output ⇒ empty network.
 * Owner: backend
 */

import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { loadTransitNetwork } from './transit-network.ts';

const contentDir = fileURLToPath(new URL('../../../../content', import.meta.url));
const dirs: string[] = [];

const line = (id: string, mode: string) =>
  JSON.stringify({ id, mode, ref: null, name: null, network: null, stops: [{ id: 'osm:node/1', name: null, position: [0, 0] }, { id: 'osm:node/2', name: null, position: [500, 0] }], path: [[0, 0], [500, 0]], lengthM: 500, gapsM: 0 });

describe('transit network', () => {
  afterAll(() => Promise.all(dirs.map((d) => rm(d, { recursive: true, force: true }))));

  it('should build a timetable per line with the profile of its mode', async () => {
    const worldDir = await mkdtemp(join(tmpdir(), 'skyline-transit-'));
    dirs.push(worldDir);
    await mkdir(join(worldDir, '08b-transit'));
    await writeFile(join(worldDir, '08b-transit', 'transit-lines.ndjson'), `${line('osm:relation/1', 'gbaka')}\n${line('osm:relation/2', 'sotra_bus')}\n`);
    const network = await loadTransitNetwork(worldDir, contentDir);
    expect([...network.keys()]).toEqual(['osm:relation/1', 'osm:relation/2']);
    expect(network.get('osm:relation/1')).toMatchObject({ seats: 18, fareDjai: 200 });
    expect(network.get('osm:relation/2')?.schedule.stopAtM).toEqual([0, 500]);
  });

  it('should be empty without pipeline output', async () => {
    expect((await loadTransitNetwork(join(tmpdir(), 'skyline-no-such-dir'), contentDir)).size).toBe(0);
  });
});
