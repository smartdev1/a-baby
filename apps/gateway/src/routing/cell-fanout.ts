/**
 * Role: per-gateway fan-out of cell snapshots: one bus subscription per cell with local players, each snapshot encoded once and the same frame sent to every session in that cell.
 * Owner: backend
 */

import { type CellSnapshot, type MessageBus, subjects, type Unsubscribe } from '@skyline/bus';
import { encodeServerMessage } from '@skyline/protocol';

type FrameSink = (frame: Uint8Array) => void;

interface CellRoute {
  readonly members: Set<FrameSink>;
  readonly unsubscribe: Unsubscribe;
}

export class CellFanout {
  private readonly routes = new Map<string, CellRoute>();

  constructor(private readonly bus: MessageBus) {}

  /** Adds a session to the cell's audience; the returned function removes it. */
  join(cellKey: string, sink: FrameSink): () => void {
    const route = this.routes.get(cellKey) ?? this.open(cellKey);
    route.members.add(sink);
    return () => {
      route.members.delete(sink);
      if (route.members.size > 0) return;
      route.unsubscribe();
      this.routes.delete(cellKey);
    };
  }

  cellsFollowed(): number {
    return this.routes.size;
  }

  private open(cellKey: string): CellRoute {
    const members = new Set<FrameSink>();
    const unsubscribe = this.bus.subscribe<CellSnapshot>(subjects.cellSnapshot(cellKey), (snapshot) => {
      const frame = encodeServerMessage(snapshot);
      for (const sink of members) sink(frame);
    });
    const route = { members, unsubscribe };
    this.routes.set(cellKey, route);
    return route;
  }
}
