# `apps/zone/src/cell/`

- **Owner:** backend developer
- **Status:** Active — T-108, T-110, T-325 (checkpoints)

## Role

`zone-cell.ts` (20 Hz authoritative tick: inputs → `@skyline/physics`, acks every tick on the session subject, one snapshot per cell at 10 Hz on `cell.<key>.snapshot`, welcome + world clock on join or handoff, border crossing through `../handoff/`, closed sessions removed on `session.closed`), `character-checkpoints.ts` (guest characters saved every 60 s and at the final disconnection — position in UTM, needs — and restored on join when their cell belongs to the cluster; anonymous dev sessions never saved), `player-slot.ts` (input queue: replays refused, ≤ 2 inputs per tick), `entity-state-code.ts`, `tick-stats.ts`.

## Rules

- Every source file starts with a `Role:` header comment; keep this README up to date.
