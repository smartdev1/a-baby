# Technical debt register

| Item | Why it exists | Removed by |
|---|---|---|
| `apps/web/src/debug/legacy-blockout/` + `apps/web/public/dev-fixtures/` | Keeps a visible scene while the tile pipeline is built. Inherits the prototype's 0.25 horizontal scale bug. | T-014 / T-015 |
| `earcut` in `@skyline/web` | Only needed by the legacy blockout (runtime triangulation). The real pipeline triangulates offline. | Frontend, with T-014 (out of the backend role) |
| Web bundle > 500 kB | Single chunk while the client is a prototype; code splitting comes with the streaming client. | J1 |
| `pnpm format:check` not enforced | Existing docs are not Prettier-formatted yet; formatting will be applied in a dedicated PR to keep diffs readable. | J0 |
| No CI pipeline yet | Prepared in T-007 (owner approval required). | T-007 |
| Code licence undecided | ARCHITECTURE Q9. | Owner decision |
