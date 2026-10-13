/**
 * Role: tests the cell runtime: join → welcome + world clock, inputs → authoritative acks, replayed and flooded inputs refused, one snapshot per cell with every player, closed sessions removed.
 * Owner: backend
 */

import { InMemoryBus, subjects } from '@skyline/bus';
import { createLogger } from '@skyline/observability';
import { CollisionWorld } from '@skyline/physics';
import type { InputMessage, ServerMessage } from '@skyline/protocol';
import { describe, expect, it } from 'vitest';
import { entityIdOf } from '../handoff/cell-handoff.ts';
import { ZoneCell } from './zone-cell.ts';

const CELL = 'C_81_49';
const forward = (seq: number): InputMessage => ({
  seq,
  moveX: 0,
  moveZ: 1,
  yawRad: 0,
  flags: { run: false, jump: false, interact: false },
});

describe('ZoneCell', () => {
  it('should welcome a joining player with the frame origin and the world clock', async () => {
    const bus = new InMemoryBus();
    const cell = new ZoneCell({
      cellKey: CELL,
      bus,
      world: new CollisionWorld(),
      frameOrigin: { eastingM: 381_000, northingM: 589_000 },
      spawn: { x: 500, z: 500 },
      clock: () => Promise.resolve({ realStartMs: 0, gameStartMin: 360, ratio: 12, paused: false }),
      logger: createLogger({ service: 'test', level: 'silent' }),
    });
    const got: ServerMessage[] = [];
    bus.subscribe<ServerMessage>(subjects.sessionOut('s1'), (m) => got.push(m));
    cell.start({ ticking: false });
    bus.publish(subjects.cellJoin(CELL), { sessionId: 's1' });
    await new Promise((r) => setTimeout(r, 0));
    cell.stop();
    expect(got[0]).toMatchObject({
      type: 'welcome',
      body: { playerEntityId: entityIdOf('s1'), tickRateHz: 20, cellKey: CELL, frameOrigin: { eastingM: 381_000 } },
    });
    expect(got[1]).toMatchObject({ type: 'worldClock', body: { ratio: 12 } });
  });

  it('should move the player only through simulated inputs and acknowledge them', async () => {
    const bus = new InMemoryBus();
    const cell = new ZoneCell({
      cellKey: CELL,
      bus,
      world: new CollisionWorld(),
      frameOrigin: { eastingM: 0, northingM: 0 },
      spawn: { x: 10, z: 10 },
      clock: () => Promise.resolve({ realStartMs: 0, gameStartMin: 0, ratio: 12, paused: false }),
      logger: createLogger({ service: 'test', level: 'silent' }),
    });
    const got: ServerMessage[] = [];
    bus.subscribe<ServerMessage>(subjects.sessionOut('s1'), (m) => got.push(m));
    bus.subscribe<ServerMessage>(subjects.cellSnapshot(CELL), (m) => got.push(m));
    cell.start({ ticking: false });
    bus.publish(subjects.cellJoin(CELL), { sessionId: 's1' });
    await new Promise((r) => setTimeout(r, 0));
    for (let seq = 1; seq <= 20; seq++) {
      bus.publish(subjects.cellInput(CELL), { sessionId: 's1', input: forward(seq) });
      cell.step();
    }
    const acks = got.filter((m) => m.type === 'inputAck');
    const last = acks.at(-1);
    expect(last?.type === 'inputAck' && last.body.lastSeq).toBe(20);
    expect(last?.type === 'inputAck' && last.body.position.z).toBeCloseTo(10 + 1.6, 5); // 1 s of walking
    expect(got.some((m) => m.type === 'snapshot' && m.body.entities.length === 1)).toBe(true);
    bus.publish(subjects.sessionClosed(), { sessionId: 's1' });
    expect(cell.tickStats().players).toBe(0);
  });

  it('should refuse replayed inputs and cap flooding to 2 inputs per tick', async () => {
    const bus = new InMemoryBus();
    const cell = new ZoneCell({
      cellKey: CELL,
      bus,
      world: new CollisionWorld(),
      frameOrigin: { eastingM: 0, northingM: 0 },
      spawn: { x: 10, z: 10 },
      clock: () => Promise.resolve({ realStartMs: 0, gameStartMin: 0, ratio: 12, paused: false }),
      logger: createLogger({ service: 'test', level: 'silent' }),
    });
    const got: ServerMessage[] = [];
    bus.subscribe<ServerMessage>(subjects.sessionOut('s1'), (m) => got.push(m));
    cell.start({ ticking: false });
    bus.publish(subjects.cellJoin(CELL), { sessionId: 's1' });
    await new Promise((r) => setTimeout(r, 0));
    for (let seq = 1; seq <= 40; seq++) bus.publish(subjects.cellInput(CELL), { sessionId: 's1', input: forward(seq) }); // flood: 40 at once
    bus.publish(subjects.cellInput(CELL), { sessionId: 's1', input: forward(3) }); // replay
    cell.step();
    const ack = got.filter((m) => m.type === 'inputAck').at(-1);
    expect(ack?.type === 'inputAck' && ack.body.lastSeq).toBe(2);
    expect(ack?.type === 'inputAck' && ack.body.position.z).toBeCloseTo(10 + 1.6 * 0.1, 5); // two 50 ms steps, not 40
  });
});
