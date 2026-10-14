/**
 * Role: interest set around an anchor (ARCHITECTURE §13.3): entities within the radius, nearest first; the first 64 ride on every snapshot and the next 128 on every other snapshot (reduced rate), the rest is not sent.
 * Owner: backend
 */

import type { EntityState } from '@skyline/protocol';
import { MESH_M, type SpatialHash } from './spatial-hash.ts';

export interface InterestLimits {
  readonly radiusM: number;
  readonly fullRate: number;
  readonly reducedRate: number;
}

/** On foot; vehicles (250 m) come with J4. */
export const DEFAULT_LIMITS: InterestLimits = { radiusM: 150, fullRate: 64, reducedRate: 128 };

export interface InterestQuery {
  /** Ground-plane point the set is computed around (the centre of the viewers' mesh). */
  readonly anchor: { readonly x: number; readonly z: number };
  /** Snapshot counter of the cell: the reduced-rate entities ride on even snapshots only. */
  readonly snapshotIndex: number;
  readonly limits?: InterestLimits;
}

/** Centre of the 32 m mesh holding a position: viewers of the same mesh share one interest set and one frame. */
export const meshAnchorOf = (p: { readonly x: number; readonly z: number }): { x: number; z: number } => ({
  x: (Math.floor(p.x / MESH_M) + 0.5) * MESH_M,
  z: (Math.floor(p.z / MESH_M) + 0.5) * MESH_M,
});

/** Entities to send with this snapshot; sorted (nearest first, ties by id) only when the caps cut the set. */
export const selectInterest = (hash: SpatialHash, query: InterestQuery): EntityState[] => {
  const limits = query.limits ?? DEFAULT_LIMITS;
  const near = hash.within(query.anchor.x, query.anchor.z, limits.radiusM);
  const count = query.snapshotIndex % 2 === 0 ? limits.fullRate + limits.reducedRate : limits.fullRate;
  if (near.length > limits.fullRate) near.sort((a, b) => a.d2 - b.d2 || a.entity.id - b.entity.id);
  return near.slice(0, count).map((n) => n.entity);
};
