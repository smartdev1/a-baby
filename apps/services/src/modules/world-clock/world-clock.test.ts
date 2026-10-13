/**
 * Role: tests the world clock module: first start from clock.json, persistence across restarts (file store), ratio change continuity, HTTP route.
 * Owner: backend
 */

import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Fastify from 'fastify';
import { gameMinutesAt } from '@skyline/sim-clock';
import { afterEach, describe, expect, it } from 'vitest';
import { registerWorldClockRoutes } from './api/world-clock-routes.ts';
import { WorldClockService } from './application/world-clock-service.ts';
import { FileClockSegmentStore, InMemoryClockSegmentStore } from './infra/clock-segment-stores.ts';

const CONFIG = { ratio: 12, initialGameMin: 360 };
let dir = '';
afterEach(async () => dir && rm(dir, { recursive: true, force: true }));

describe('WorldClockService', () => {
  it('should start the world at initialGameMin and keep the same segment after a restart', async () => {
    dir = await mkdtemp(join(tmpdir(), 'clock-'));
    const path = join(dir, 'world-clock.json');
    const first = await new WorldClockService(new FileClockSegmentStore(path), CONFIG, () => 1_000).current();
    const afterRestart = await new WorldClockService(new FileClockSegmentStore(path), CONFIG, () => 999_999).current();
    expect(first).toEqual({ realStartMs: 1_000, gameStartMin: 360, ratio: 12, paused: false });
    expect(afterRestart).toEqual(first);
  });

  it('should keep game time continuous when the ratio changes', async () => {
    let now = 0;
    const service = new WorldClockService(new InMemoryClockSegmentStore(), CONFIG, () => now);
    await service.current();
    now = 600_000;
    const before = gameMinutesAt(await service.current(), now);
    const changed = await service.setRatio(60);
    expect(gameMinutesAt(changed, now)).toBe(before);
    expect((await service.pause()).paused).toBe(true);
    expect((await service.resume()).paused).toBe(false);
  });

  it('should serve the segment over HTTP', async () => {
    const server = Fastify();
    registerWorldClockRoutes(server, new WorldClockService(new InMemoryClockSegmentStore(), CONFIG, () => 5), () => 42);
    const response = await server.inject({ method: 'GET', url: '/api/v1/world-clock' });
    expect(response.json()).toEqual({ segment: { realStartMs: 5, gameStartMin: 360, ratio: 12, paused: false }, serverTimeMs: 42 });
    await server.close();
  });
});
