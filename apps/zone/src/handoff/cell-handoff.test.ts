/**
 * Role: tests cell border crossing: a player walking east is handed to the neighbour cell of the cluster with its absolute state, inputs still sent to the old cell are forwarded, and players are stopped at the edge of an unowned cell.
 * Owner: backend
 */

import { type CellHandoff, InMemoryBus, subjects } from '@skyline/bus';
import { createLogger } from '@skyline/observability';
import { CollisionWorld } from '@skyline/physics';
import type { InputMessage, ServerMessage } from '@skyline/protocol';
import { describe, expect, it } from 'vitest';
import { entityIdOf, leftCellTowards } from './cell-handoff.ts';
import { ZoneCell } from '../cell/zone-cell.ts';

const WEST = 'C_81_49';
const EAST = 'C_82_49';
const east = (seq: number): InputMessage => ({ seq, moveX: 1, moveZ: 0, yawRad: 0, flags: { run: true, jump: false, interact: false } });
const settle = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

const cellOf = (bus: InMemoryBus, cellKey: string, eastingM: number, cluster: string[]): ZoneCell =>
  new ZoneCell({
    cellKey,
    bus,
    world: new CollisionWorld(),
    frameOrigin: { eastingM, northingM: 589_000 },
    spawn: { x: 998, z: 500 },
    clock: () => Promise.resolve({ realStartMs: 0, gameStartMin: 360, ratio: 12, paused: false }),
    logger: createLogger({ service: 'test', level: 'silent' }),
    clusterCells: new Set(cluster),
  });

describe('cell handoff', () => {
  it('should detect the cell a player has walked into', () => {
    const origin = { eastingM: 381_000, northingM: 589_000 };
    const at = (x: number): { position: { x: number; y: number; z: number }; velocity: { x: number; y: number; z: number }; grounded: boolean } => ({
      position: { x, y: 0, z: 500 },
      velocity: { x: 0, y: 0, z: 0 },
      grounded: true,
    });
    expect(leftCellTowards(at(999.9), origin)).toBeNull();
    expect(leftCellTowards(at(1000.1), origin)).toBe(EAST);
    expect(leftCellTowards(at(-0.1), origin)).toBe('C_80_49');
  });

  it('should hand a player over to the neighbour cell with the same entity and sequence', async () => {
    const bus = new InMemoryBus();
    const west = cellOf(bus, WEST, 381_000, [WEST, EAST]);
    const eastCell = cellOf(bus, EAST, 382_000, [WEST, EAST]);
    const handoffs: CellHandoff[] = [];
    const out: ServerMessage[] = [];
    bus.subscribe<CellHandoff>(subjects.cellHandoff(EAST), (m) => handoffs.push(m));
    bus.subscribe<ServerMessage>(subjects.sessionOut('s1'), (m) => out.push(m));
    west.start({ ticking: false });
    eastCell.start({ ticking: false });
    bus.publish(subjects.cellJoin(WEST), { sessionId: 's1' });
    await settle();
    for (let seq = 1; seq <= 10 && handoffs.length === 0; seq++) {
      bus.publish(subjects.cellInput(WEST), { sessionId: 's1', input: east(seq) });
      west.step();
    }
    await settle();
    west.stop();
    eastCell.stop();
    expect(handoffs).toHaveLength(1);
    expect(handoffs[0]?.eastingM).toBeGreaterThanOrEqual(382_000);
    expect(handoffs[0]?.entityId).toBe(entityIdOf('s1'));
    const welcomes = out.filter((m) => m.type === 'welcome');
    expect(welcomes.at(-1)).toMatchObject({ body: { cellKey: EAST, playerEntityId: entityIdOf('s1'), frameOrigin: { eastingM: 382_000 } } });
    expect(eastCell.tickStats()).toMatchObject({ players: 1, handoffsIn: 1 });
    expect(west.tickStats()).toMatchObject({ players: 0 });
  });

  it('should forward inputs still routed to the old cell to the new one', async () => {
    const bus = new InMemoryBus();
    const west = cellOf(bus, WEST, 381_000, [WEST, EAST]);
    const eastCell = cellOf(bus, EAST, 382_000, [WEST, EAST]);
    const acks: number[] = [];
    bus.subscribe<ServerMessage>(subjects.sessionOut('s1'), (m) => m.type === 'inputAck' && acks.push(m.body.lastSeq));
    west.start({ ticking: false });
    eastCell.start({ ticking: false });
    bus.publish(subjects.cellJoin(WEST), { sessionId: 's1' });
    await settle();
    let seq = 0;
    while (west.tickStats().players === 1 && seq < 10) {
      bus.publish(subjects.cellInput(WEST), { sessionId: 's1', input: east(++seq) });
      west.step();
    }
    await settle();
    bus.publish(subjects.cellInput(WEST), { sessionId: 's1', input: east(++seq) }); // gateway has not switched yet
    eastCell.step();
    west.stop();
    eastCell.stop();
    expect(acks.at(-1)).toBe(seq);
  });

  it('should stop a player at the edge of a cell no zone owns', async () => {
    const bus = new InMemoryBus();
    const west = cellOf(bus, WEST, 381_000, [WEST]);
    const handoffs: CellHandoff[] = [];
    const acks: ServerMessage[] = [];
    bus.subscribe<CellHandoff>(subjects.cellHandoff(EAST), (m) => handoffs.push(m));
    bus.subscribe<ServerMessage>(subjects.sessionOut('s1'), (m) => m.type === 'inputAck' && acks.push(m));
    west.start({ ticking: false });
    bus.publish(subjects.cellJoin(WEST), { sessionId: 's1' });
    await settle();
    for (let seq = 1; seq <= 10; seq++) {
      bus.publish(subjects.cellInput(WEST), { sessionId: 's1', input: east(seq) });
      west.step();
    }
    west.stop();
    expect(handoffs).toHaveLength(0);
    const last = acks.at(-1);
    expect(last?.type === 'inputAck' && last.body.position.x).toBeLessThan(1000);
    expect(west.tickStats()).toMatchObject({ players: 1 });
  });
});
