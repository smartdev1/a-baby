# `apps/zone/src/cell/`

- **Owner:** backend developer
- **Status:** Active — T-108

## Role

`zone-cell.ts` (20 Hz authoritative tick: inputs → `@skyline/physics`, acks every tick, snapshots at 10 Hz, welcome + world clock on join), `player-slot.ts` (input queue: replays refused, ≤ 2 inputs per tick), `entity-state-code.ts`, `tick-stats.ts`.

## Rules

- Every source file starts with a `Role:` header comment; keep this README up to date.
