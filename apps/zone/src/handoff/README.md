# `apps/zone/src/handoff/`

- **Owner:** backend developer
- **Status:** Active — T-110 (border crossing); ghosts at borders planned — J5

## Role

Transfer of players between cells.

| File | Role |
|---|---|
| `cell-handoff.ts` | Detects a player leaving the 1 km cell, builds the `CellHandoff` message (absolute UTM state, same entity id and input sequence) and rebuilds the state in the receiving cell's frame; entity ids are an FNV-1a hash of the session id, unique without coordination. |
| `input-forwarding.ts` | For 2 s after a handoff, inputs still routed to the old cell are forwarded to the new one (the gateway switches on the next `welcome`). |

## How it works

1. After simulating a player, `ZoneCell` checks whether it left the cell. Into a cell of the cluster → `cell.<target>.handoff` and the player is removed; into an unowned cell → the move is undone (edge of the world).
2. The receiving cell adopts the player and sends `welcome` (new `cellKey` and `frameOrigin`, same `playerEntityId`) and `worldClock`.
3. The gateway session sees the new `cellKey` in `welcome`, sends later inputs there and follows that cell's snapshots.

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
