/**
 * Role: tests the interest selection: mesh anchors, radius on the ground plane, nearest first with stable ties, full-rate cap on every snapshot and reduced-rate entities on even snapshots only.
 * Owner: backend
 */

import type { EntityState } from '@skyline/protocol';
import { describe, expect, it } from 'vitest';
import { meshAnchorOf, selectInterest } from './interest-selection.ts';
import { SpatialHash } from './spatial-hash.ts';

const at = (id: number, x: number, z: number): EntityState => ({ id, position: { x, y: 0, z }, yawRad: 0, state: 0 });

describe('interest selection', () => {
  const anchor = { x: 0, z: 0 };
  const entities = [at(1, 0, 0), at(2, 10, 0), at(3, 0, -40), at(4, 149, 0), at(5, 151, 0), at(6, -100, 100), at(7, 0, 10)];
  const hash = new SpatialHash(entities);

  it('should anchor viewers on the centre of their 32 m mesh', () => {
    expect(meshAnchorOf({ x: 3, z: -1 })).toEqual({ x: 16, z: -16 });
    expect(meshAnchorOf({ x: 31.9, z: 0 })).toEqual({ x: 16, z: 16 });
  });

  it('should keep the entities within the radius', () => {
    expect(selectInterest(hash, { anchor, snapshotIndex: 0 }).map((e) => e.id).sort()).toEqual([1, 2, 3, 4, 6, 7]);
  });

  it('should send the nearest first and the reduced-rate entities every other snapshot only', () => {
    const limits = { radiusM: 150, fullRate: 2, reducedRate: 2 };
    expect(selectInterest(hash, { anchor, snapshotIndex: 0, limits }).map((e) => e.id)).toEqual([1, 2, 7, 3]);
    expect(selectInterest(hash, { anchor, snapshotIndex: 1, limits }).map((e) => e.id)).toEqual([1, 2]);
  });

  it('should cap a crowd at 64 + 128 entities', () => {
    const crowd = Array.from({ length: 500 }, (_, k) => at(k + 10, (k % 25) * 4, Math.floor(k / 25) * 4));
    const crowdHash = new SpatialHash(crowd);
    expect(selectInterest(crowdHash, { anchor, snapshotIndex: 0 })).toHaveLength(192);
    expect(selectInterest(crowdHash, { anchor, snapshotIndex: 1 })).toHaveLength(64);
  });
});
