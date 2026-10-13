# SKYLINE — Next tasks (backlog proposal)

Format follows `CLAUDE.md` (Kanban light, WIP limit: 2 `doing`). Each task can be split into `docs/backlog/T-0XX-short-title.md`.

## Current state

- Client renders `world.json` + `props.json` through `WorldRenderer` (ground, roads, extruded buildings, thin-instanced props).
- `WorldGenerator` produces nothing displayable (sector filters return 0 items). It is no longer used by `main.ts`.
- Server does not build (tsconfig typo, non-existent `@colyseus/http`, bad imports).
- Camera is a debug fly camera, no collision, no player.

## Priority overview

| ID    | Title                                              | Prio | Size | Owner            | Needs approval |
| ----- | -------------------------------------------------- | ---- | ---- | ---------------- | -------------- |
| T-001 | Fix server build errors                            | P0   | S    | fullstack-devops | config edit    |
| T-002 | Confirm building extrusion (earcut)                | P0   | S    | fullstack-devops | new dependency |
| T-003 | Decide world source of truth (OSM vs level design) | P0   | S    | tech-lead-po     | ADR            |
| T-004 | Fix world scale normalization                      | P1   | M    | fullstack-devops | none           |
| T-005 | Fix road-side prop placement                       | P1   | S    | fullstack-devops | none           |
| T-006 | Refactor `WorldGenerator` to return sector data    | P1   | M    | fullstack-devops | none           |
| T-007 | Player controller + TPS/FPS camera (MVP-03..05)    | P0   | L    | fullstack-devops | none           |
| T-008 | Shared collision data + kinematic controller       | P0   | M    | fullstack-devops | none           |
| T-009 | HUD + performance measurement (MVP-28)             | P1   | S    | fullstack-devops | none           |
| T-010 | Repo hygiene (compiled files, root debug scripts)  | P2   | S    | fullstack-devops | deletions      |
| T-011 | Fix `world-generator` test scripts                 | P2   | S    | fullstack-qa     | none           |
| T-012 | Real `packages/contracts` package                  | P2   | S    | fullstack-devops | dependencies   |

Suggested order: T-001 → T-002 → T-003 (parallel, small) → T-004 → T-007/T-008 → rest.

---

## T-001 — Fix server build errors

```yaml
id: T-001
status: todo
owner: fullstack-devops
priority: P0
size: S
```

### Context

`tsc` fails on `apps/server` with 6 errors.

### Acceptance criteria

- [ ] `strictFunctionType` renamed `strictFunctionTypes` in `tsconfig.base.json`.
- [ ] `apps/server/src/index.ts` imports `Server` from `colyseus` (not `@colyseus/http`).
- [ ] Unused `GameConfig` import removed; unused `req` renamed `_req`.
- [ ] Server uses `createServer(app)` from `http` and `new Server({ server: httpServer })`.
- [ ] `npm run build --prefix apps/server` passes; `GET /health` returns 200 locally.

### Out of scope

Rooms, matchmaking, Prisma wiring.

---

## T-002 — Confirm building extrusion (earcut)

```yaml
id: T-002
status: todo
owner: fullstack-devops
priority: P0
size: S
```

### Context

`ExtrudePolygon` needs Earcut. Without it `WorldRenderer` falls back to bounding boxes.

### Acceptance criteria

- [ ] Console log `World built: {...}` is inspected; `fallbackBoxes` value recorded.
- [ ] If `fallbackBoxes > 0`: add `earcut` dependency (user approval required) and expose it to Babylon.
- [ ] `fallbackBoxes === 0` and no `ExtrudePolygon failed` warning.

### Technical notes

Dependency change is a sensitive action: request explicit validation first.

---

## T-003 — Decide world source of truth (OSM vs level design)

```yaml
id: T-003
status: todo
owner: tech-lead-po
priority: P0
size: S
```

### Context

Two incompatible sources exist:

- `world.json` generated from real OSM data (Abidjan block).
- `SKYLINE_dossier_level_design_carte_MVP.md`: fictional district with fixed functional places (garage at (65,85), depot at (250,215), spawns, safe zones, NPC positions).

The CDC states the district is fictional and must not reproduce a real neighbourhood.

### Acceptance criteria

- [ ] ADR in `docs/adr/` choosing one: (a) OSM as visual base, level-design places overlaid and buildings adapted; (b) level-design blockout as truth, OSM only as inspiration; (c) hybrid.
- [ ] Decision on how mission/NPC coordinates are validated against buildings/roads.
- [ ] Note on real-place reproduction risk (CDC section 12).

### Out of scope

Implementing the chosen option.

---

## T-004 — Fix world scale normalization

```yaml
id: T-004
status: todo
owner: fullstack-devops
priority: P1
size: M
```

### Context

`GeoJSONImporter.normalizeToBounds` fits _all_ points (long roads included) into 300×300 m. Result: scale ≈ 0.25, buildings concentrated in roughly x 126–226, y 196–282, while sectors A1–A3/B1 are almost empty and roads run off to the world edge.

### Acceptance criteria

- [ ] Normalization computed from the area of interest (buildings + POIs), not from road extents; roads clipped to bounds.
- [ ] Buildings cover the 300×300 m district reasonably (density check per sector, logged).
- [ ] `world.json`, `road-network.json`, `props.json` regenerated consistently.
- [ ] Unit test: all projected points within `[0, 300]`.

### Technical notes

Depends on T-003 (which source is kept). Regeneration overwrites existing JSON files.

---

## T-005 — Fix road-side prop placement

```yaml
id: T-005
status: todo
owner: fullstack-devops
priority: P1
size: S
```

### Context

`PropPlacer` places street lights on the road axis and trees with a random, non-perpendicular offset. It also interpolates between first/last point only, ignoring intermediate geometry.

### Acceptance criteria

- [ ] Props offset perpendicular to the edge, at `width/2 + margin`, alternating sides.
- [ ] Props never placed inside a building footprint (point-in-polygon check).
- [ ] Deterministic output (seeded RNG instead of `Math.random`) so regenerations are stable.
- [ ] Prop ids stable across runs.
- [ ] `maxProps` limit actually enforced.

---

## T-006 — Refactor `WorldGenerator` to return sector data

```yaml
id: T-006
status: todo
owner: fullstack-devops
priority: P1
size: M
```

### Context

`generateSector` logs counts and discards results. `filterEdgesInSector` reads `edge.geometry` but `RawRoad` exposes `path`, so it always returns 0 roads. Sector `PropPlacer` receives `{ edges: sectorRoads }` (array) while it expects edges as Map/dict.

### Acceptance criteria

- [ ] `generateSector(id)` returns `{ buildings, roads, props, pois }` (pure data, no Babylon dependency).
- [ ] Road filtering uses the correct field and clips to sector bounds.
- [ ] Props not duplicated across sectors (POI props generated once).
- [ ] Vitest tests: counts per sector sum to totals; no item lost or duplicated.
- [ ] `WorldRenderer` can build per sector (foundation for progressive loading, CDC 17.3).

### Out of scope

Streaming/unloading logic.

---

## T-007 — Player controller + TPS/FPS camera (MVP-03, 04, 05)

```yaml
id: T-007
status: todo
owner: fullstack-devops
priority: P0
size: L
```

### User story

As a player, I want to walk, run, jump and crouch in the district and switch between TPS and FPS with `V`.

### Acceptance criteria

- [ ] Keyboard input via physical key codes (works AZERTY and QWERTY).
- [ ] Pointer Lock for mouse look; `Esc` releases.
- [ ] Walk 3 m/s, sprint 6 m/s (provisional, config-driven).
- [ ] Jump, crouch.
- [ ] TPS default, FPS on `V`, camera does not clip through walls.
- [ ] Debug fly camera kept behind a flag.

### Technical notes

Movement logic must be pure TypeScript, independent of Babylon (reused by server, see T-008).

---

## T-008 — Shared collision data + kinematic controller

```yaml
id: T-008
status: todo
owner: fullstack-devops
priority: P0
size: M
```

### Context

CDC 14.9: same controller and same collision file on client and server.

### Acceptance criteria

- [ ] Collision exported from building footprints as simple volumes (extruded polygons or boxes) in a compact JSON.
- [ ] `packages/shared` contains a capsule-vs-static-geometry controller in pure TS.
- [ ] Fixed timestep identical client/server.
- [ ] District boundary is closed (player cannot leave the 300×300 m area).
- [ ] Vitest: walk into wall, slide along wall, no tunnelling at sprint speed, no stuck pockets in a capsule sweep.

### Technical notes

Depends on T-004 (final geometry) to avoid regenerating collision twice.

---

## T-009 — HUD + performance measurement (MVP-28)

```yaml
id: T-009
status: todo
owner: fullstack-devops
priority: P1
size: S
```

### Acceptance criteria

- [ ] HUD shows FPS, draw calls, active meshes, triangle count (Babylon instrumentation).
- [ ] Baseline recorded in `docs/` against budgets: ≤ 300 draw calls, ≤ 400k triangles, ≤ 40 materials.
- [ ] Reference machine to be defined (open item in CDC).

---

## T-010 — Repo hygiene

```yaml
id: T-010
status: todo
owner: fullstack-devops
priority: P2
size: S
```

### Acceptance criteria (each deletion requires explicit approval)

- [ ] Remove compiled artefacts in `packages/world-generator/scripts/` (`*.js`, `*.d.ts`, `*.map`).
- [ ] Remove root debug scripts (`check_*.js`, `debug_*.js`, `test_*.js`, `test_output.txt`, `check_road.bat`) or move useful ones to `scripts/`.
- [ ] Remove `apps/server/src/index.ts.bak`.
- [ ] Hard-coded `C:\Users\...` paths replaced by relative paths if scripts are kept.
- [ ] `.gitignore` updated for generated files if applicable.
- [ ] Duplicate Prisma schema resolved (`prisma/` vs `config/prisma/`).
- [ ] Remove unused `vite-plugin-babel-macros`.

---

## T-011 — Fix `world-generator` test scripts

```yaml
id: T-011
status: todo
owner: fullstack-qa
priority: P2
size: S
```

### Known defects

- `test-prop-placer.ts`: `this.calculatePathLength` used outside a class (crash).
- `test-building-placer.ts`: `RawWorldDataType` not imported; `height / 3` on a string key; `buildings.json` stays `[]`.
- `test-road-props.ts`: `PropPlacer` constructor arguments in wrong order.
- `test-road-network.ts`: writes `nodes/edges` as arrays; other scripts read them as objects.
- Package is `"type": "commonjs"` but scripts use `import.meta.url` (cause of the `ERR_MODULE_NOT_FOUND` seen in `test_output.txt`).

### Acceptance criteria

- [ ] All scripts run with `npx tsx` without error.
- [ ] Converted to Vitest tests where relevant (`npm test`).
- [ ] `buildings.json` regenerated non-empty.

---

## T-012 — Real `packages/contracts` package

```yaml
id: T-012
status: todo
owner: fullstack-devops
priority: P2
size: S
```

### Acceptance criteria

- [ ] `packages/contracts/package.json` with a workspace name.
- [ ] Added as dependency of web and server (dependency change: approval required).
- [ ] Runtime validation schemas (Zod or Valibot, choice documented in an ADR).
- [ ] `export type {…}` duplicated declarations cleaned (types currently exported twice).

---

## Risks to watch

| Risk                                                | Mitigation                                                            |
| --------------------------------------------------- | --------------------------------------------------------------------- |
| Building more generation code before seeing results | Visual check after each change, as done with `WorldRenderer`          |
| Data/level-design divergence                        | T-003 before any gameplay placement                                   |
| Client/server collision divergence                  | One file, one controller (T-008)                                      |
| Overwriting generated JSON                          | Version generated data or script regeneration; ask before overwriting |

## Next action

User decision needed on T-003, then validation of the first two tasks to move to `doing`.
