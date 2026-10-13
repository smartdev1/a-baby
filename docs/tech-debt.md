# Technical debt register

| Item | Why it exists | Removed by |
|---|---|---|
| `apps/web/src/debug/legacy-blockout/` + `apps/web/public/dev-fixtures/` | Keeps a visible scene while the tile pipeline is built. Inherits the prototype's 0.25 horizontal scale bug. | T-014 / T-015 |
| `tools/map-pipeline/legacy/` | Reference code for the pipeline rewrite; excluded from lint, typecheck and header checks. | T-010 … T-012 |
| `earcut` in `@skyline/web` | Only needed by the legacy blockout (runtime triangulation). The real pipeline triangulates offline. | T-015 |
| Web bundle > 500 kB | Single chunk while the client is a prototype; code splitting comes with the streaming client. | J1 |
| `pnpm format:check` not enforced | Existing docs are not Prettier-formatted yet; formatting will be applied in a dedicated PR to keep diffs readable. | J0 |
| No CI pipeline yet | Prepared in T-007 (owner approval required). | T-007 |
| Code licence undecided | ARCHITECTURE Q9. | Owner decision |
