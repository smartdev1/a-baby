# `apps/gateway/src/interest/`

- **Owner:** backend developer
- **Status:** Active — T-317 (J5-04)

## Role

Interest management (ARCHITECTURE §13.3): each client receives only the entities near its player instead of the whole cell (spike SP3: ≈ 730 kbit/s per player with 500 players in a cell).

| File | Role |
|---|---|
| `spatial-hash.ts` | 32 m spatial hash of a snapshot's entities, built once per cell snapshot, queried by radius |
| `interest-selection.ts` | Interest set around the centre of a 32 m mesh: radius 150 m, nearest first; 64 entities with every snapshot (10 Hz), the next 128 every other snapshot (5 Hz), the rest not sent |

Viewers of the same mesh share one interest set and one encoded frame (at most 23 m of anchor error, well inside the 150 m radius); the frame may contain the viewer's own entity, which the client ignores.

Runs in the gateway fan-out (`routing/cell-fanout.ts`), not in the zone: the cell keeps publishing **one** snapshot per cell on the bus, and each gateway composes the per-client frames for its own sessions (SP3 showed per-player snapshots over the bus are O(N²)). To be confirmed by the owner (ARCHITECTURE §13.2 step 8 places it in the zone).

Measured with 500 bots in one cell: 753 → 199 kbit/s per bot (T-317).

The client drops a remote entity after 1 s without update, so 5 Hz entities never blink. Priorities other than distance (interaction in progress, friends, relative speed) and the vehicle radius (250 m) come later.

## Rules

- Every source file starts with a `Role:` header comment; keep this README up to date.
