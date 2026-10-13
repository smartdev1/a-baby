# `tools/map-pipeline/src/stages/11-facades-roofs/`

- **Owner:** backend developer
- **Status:** Active — T-102

## Role

Buildings (06) + car roads (08) + terrain (10) → `facades.ndjson` (facade bay and roof accessory instances, UTM, absolute height) + `roofs.ndjson` (pitched sheet-metal roofs by building id) + `facades-report.json` (counts by profile and module). Stage 14 assigns instances to tiles and roofs to building parts; stage 16 writes them into `instances.bin` and `geom.glb`.

Logic: `../../facades/`. Version 1.

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
