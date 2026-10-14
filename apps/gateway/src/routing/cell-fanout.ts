/**
 * Role: per-gateway fan-out of cell snapshots: one bus subscription per cell with local players; each snapshot is indexed once (spatial hash), then one interest set and one frame per 32 m mesh holding viewers, sent to every session of that mesh (ARCHITECTURE §13.3).
 * Owner: backend
 */

import { type CellSnapshot, type MessageBus, subjects, type Unsubscribe } from '@skyline/bus';
import { encodeServerMessage, type EntityState } from '@skyline/protocol';
import { meshAnchorOf, selectInterest } from '../interest/interest-selection.ts';
import { SpatialHash } from '../interest/spatial-hash.ts';

/** A session following a cell: where its frames go and which entity is its player (null before its welcome). */
export interface Viewer {
  readonly send: (frame: Uint8Array) => void;
  readonly entityId: () => number | null;
}

interface CellRoute {
  readonly members: Set<Viewer>;
  unsubscribe: Unsubscribe;
  snapshots: number;
}

export class CellFanout {
  private readonly routes = new Map<string, CellRoute>();
  private framesSent = 0;
  private entitiesSent = 0;

  constructor(private readonly bus: MessageBus) {}

  /** Adds a session to the cell's audience; the returned function removes it. */
  join(cellKey: string, viewer: Viewer): () => void {
    const route = this.routes.get(cellKey) ?? this.open(cellKey);
    route.members.add(viewer);
    return () => {
      route.members.delete(viewer);
      if (route.members.size > 0) return;
      route.unsubscribe();
      this.routes.delete(cellKey);
    };
  }

  cellsFollowed(): number {
    return this.routes.size;
  }

  /** Average entities per composed frame so far (bandwidth indicator). */
  entitiesPerFrame(): number {
    return this.framesSent === 0 ? 0 : this.entitiesSent / this.framesSent;
  }

  private open(cellKey: string): CellRoute {
    const route: CellRoute = { members: new Set(), unsubscribe: () => undefined, snapshots: 0 };
    route.unsubscribe = this.bus.subscribe<CellSnapshot>(subjects.cellSnapshot(cellKey), (snapshot) => this.fanOut(route, snapshot));
    this.routes.set(cellKey, route);
    return route;
  }

  private fanOut(route: CellRoute, snapshot: CellSnapshot): void {
    const { entities, tick } = snapshot.body;
    const hash = new SpatialHash(entities);
    const byId = new Map<number, EntityState>(entities.map((e) => [e.id, e]));
    const snapshotIndex = route.snapshots++;
    const frames = new Map<string, Uint8Array>();
    for (const member of route.members) {
      const id = member.entityId();
      const viewer = id === null ? undefined : byId.get(id);
      // Not in this snapshot yet (just joined or handed over): nothing to anchor the interest on.
      if (!viewer) continue;
      const anchor = meshAnchorOf(viewer.position);
      const key = `${anchor.x}:${anchor.z}`;
      let frame = frames.get(key);
      if (!frame) {
        const visible = selectInterest(hash, { anchor, snapshotIndex });
        frame = encodeServerMessage({ type: 'snapshot', body: { tick, entities: visible } });
        frames.set(key, frame);
        this.entitiesSent += visible.length;
        this.framesSent++;
      }
      member.send(frame);
    }
  }
}
