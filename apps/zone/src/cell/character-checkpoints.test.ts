/**
 * Role: tests character persistence in a cell: a guest character that walked and disconnected is saved and comes back where it stood; anonymous sessions are never saved; a checkpoint in a cell no zone owns is ignored.
 * Owner: backend
 */

import { InMemoryBus, subjects } from '@skyline/bus';
import { createLogger } from '@skyline/observability';
import { CollisionWorld } from '@skyline/physics';
import { describe, expect, it } from 'vitest';
import { FileCharacterStore, InMemoryCharacterStore } from '../adapters/file-character-store.ts';
import { ZoneCell } from './zone-cell.ts';

const CELL = 'C_81_49';
const origin = { eastingM: 381_000, northingM: 589_000 };
const settle = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

const cellWith = (bus: InMemoryBus, characters: InMemoryCharacterStore) =>
  new ZoneCell({
    cellKey: CELL,
    bus,
    world: new CollisionWorld(),
    frameOrigin: origin,
    spawn: { x: 500, z: 500 },
    clock: () => Promise.resolve({ realStartMs: 0, gameStartMin: 360, ratio: 12, paused: false }),
    logger: createLogger({ service: 'test', level: 'silent' }),
    characters,
  });

const walk = (bus: InMemoryBus, cell: ZoneCell, sessionId: string) => {
  for (let seq = 1; seq <= 20; seq++) {
    bus.publish(subjects.cellInput(CELL), { sessionId, input: { seq, moveX: 0, moveZ: 1, yawRad: 0, flags: { run: true, jump: false, interact: false } } });
    cell.step();
  }
};

describe('character checkpoints', () => {
  it('should save a guest character at disconnection and bring it back where it stood', async () => {
    const bus = new InMemoryBus();
    const store = new InMemoryCharacterStore();
    const cell = cellWith(bus, store);
    cell.start({ ticking: false });
    bus.publish(subjects.cellJoin(CELL), { sessionId: 's1', characterId: 'acc_1' });
    bus.publish(subjects.cellJoin(CELL), { sessionId: 'anon' });
    await settle();
    walk(bus, cell, 's1');
    const walked = cell.positionOf('s1');
    bus.publish(subjects.sessionClosed(), { sessionId: 's1' });
    bus.publish(subjects.sessionClosed(), { sessionId: 'anon' });
    await settle();
    expect([...store.saved.keys()]).toEqual(['acc_1']);
    expect(store.saved.get('acc_1')).toMatchObject({ eastingM: origin.eastingM + (walked?.x ?? 0), northingM: origin.northingM + (walked?.z ?? 0), needs: null });
    bus.publish(subjects.cellJoin(CELL), { sessionId: 's2', characterId: 'acc_1' });
    await settle();
    cell.stop();
    expect(cell.positionOf('s2')?.z).toBeCloseTo(walked?.z ?? 0);
    expect(walked?.z).toBeGreaterThan(502);
  });

  it('should ignore a checkpoint in a cell no zone owns', async () => {
    const bus = new InMemoryBus();
    const store = new InMemoryCharacterStore();
    await store.save({ characterId: 'acc_2', eastingM: origin.eastingM + 5000, northingM: origin.northingM, y: 0, yawRad: 0, needs: null, savedAtMs: 0 });
    const cell = cellWith(bus, store);
    cell.start({ ticking: false });
    bus.publish(subjects.cellJoin(CELL), { sessionId: 's3', characterId: 'acc_2' });
    await settle();
    cell.stop();
    expect(cell.positionOf('s3')).toEqual({ x: 500, z: 500 });
  });

  it('should refuse unsafe character ids in the file store', async () => {
    const store = new FileCharacterStore('/nonexistent-dir-for-test');
    expect(await store.load('../etc/passwd')).toBeNull();
  });

  it('should save every guest character when the cell is flushed (shutdown)', async () => {
    const bus = new InMemoryBus();
    const store = new InMemoryCharacterStore();
    const cell = cellWith(bus, store);
    cell.start({ ticking: false });
    bus.publish(subjects.cellJoin(CELL), { sessionId: 's4', characterId: 'acc_4' });
    await settle();
    walk(bus, cell, 's4');
    await cell.flush();
    cell.stop();
    expect(store.saved.get('acc_4')?.northingM).toBeCloseTo(origin.northingM + (cell.positionOf('s4')?.z ?? 0));
  });
});
