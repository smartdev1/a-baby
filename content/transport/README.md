# `content/transport/`

- **Owner:** backend developer
- **Status:** Active — J4

## Role

Transport data: `services/` (service profile per line mode, T-316), `lines/` (per-line overrides, planned), `fares/` (planned). The lines themselves come from OSM (pipeline stage `08b-transit`).

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
