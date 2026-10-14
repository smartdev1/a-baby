# `apps/zone/src/world-data/`

- **Owner:** backend developer
- **Status:** Active — T-108

## Role

`cell-collision-loader.ts`: loads the collision tiles of a cell + neighbour ring from a pipeline release; frame origin = cell south-west corner.

`cell-places-loader.ts` (T-308): typed places of the cell and their action sites from the tiles' `meta.json`, in the cell frame.

## Rules

- Every source file starts with a `Role:` header comment; keep this README up to date.
