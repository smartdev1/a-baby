# `apps/zone/src/handoff/`

- **Owner:** backend developer
- **Status:** Active — T-110 (border crossing), T-319 (hysteresis, ghosts)

## Role

Transfer of players between cells.

| File | Role |
|---|---|
| `cell-handoff.ts` | Detects a player leaving the 1 km cell and its depth past the border (handoff only beyond 20 m), builds the `CellHandoff` message (absolute UTM state, same entity id and input sequence) and rebuilds the state in the receiving cell's frame; entity ids are an FNV-1a hash of the session id, unique without coordination. |
| `cell-ghosts.ts` | Border ghosts: players within 200 m of a border published read-only (absolute UTM) to the neighbour cells of the cluster at 10 Hz; `GhostBoard` keeps the latest ghosts of each neighbour (dropped after 500 ms) and gives them in the cell's frame, without the entities the cell owns |
| `input-forwarding.ts` | For 2 s after a handoff, inputs still routed to the old cell are forwarded to the new one (the gateway switches on the next `welcome`). |

## How it works

1. After simulating a player, `ZoneCell` checks whether it left the cell. Into an unowned cell → the move is undone at the border (edge of the world). Into a cell of the cluster: up to 20 m past the border the player stays in this cell (hysteresis: walking along a border does not bounce between cells); beyond → `cell.<target>.handoff` and the player is removed.
2. The receiving cell adopts the player and sends `welcome` (new `cellKey` and `frameOrigin`, same `playerEntityId`) and `worldClock`.
3. The gateway session sees the new `cellKey` in `welcome`, sends later inputs there and follows that cell's snapshots.
4. Every snapshot (10 Hz), each cell sends its players near a border to the neighbours as ghosts (`cell.<neighbour>.ghosts`) and merges the ghosts it received into its own snapshot, so the gateway's interest sets cover both sides of a border without composing anything.

Not yet across borders: the proximity chat and group actions (J5-12).

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
