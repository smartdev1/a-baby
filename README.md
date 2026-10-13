# SkyLine — Yopougon

3D web virtual-life game: the whole commune of **Yopougon (Abidjan)** rebuilt at **real 1:1 scale** from OpenStreetMap data. Players live together in a single persistent world: work, take a gbaka or a woro-woro, rent a flat, open a maquis, earn and spend **Djai** (fictional currency).

- Vision, architecture and rules: [`ARCHITECTURE.md`](ARCHITECTURE.md)
- Roadmap (J0 → J7): [`docs/roadmap.md`](docs/roadmap.md) · Decisions: [`docs/adr/`](docs/adr) · Tasks: [`docs/backlog/`](docs/backlog)
- Developer rules: [`docs/rules/FRONTEND.md`](docs/rules/FRONTEND.md) · [`docs/rules/BACKEND.md`](docs/rules/BACKEND.md)
- Map data attribution: [`ATTRIBUTION.md`](ATTRIBUTION.md)

## Requirements (Windows and Linux)

- **Node.js 24** (`.nvmrc`) — `nvm install 24 && nvm use 24` (or nvm-windows)
- **pnpm** — `npm i -g pnpm`
- Docker (PostgreSQL, NATS, osmium — from J1/J6)
- For 3D work: Blender ≥ 4, KTX-Software (`toktx`), Git LFS — see `.claude/skills/3d-asset-pipeline/SKILL.md`

## Quick start

```bash
pnpm install
pnpm dev            # web client on http://localhost:5173 (temporary blockout viewer)
pnpm dev:services   # HTTP services on http://127.0.0.1:8080/health
pnpm dev:server     # all-in-one: services :8080 + zone + WebSocket gateway :2567/ws (run pnpm map:build first for real collisions)
```

## Quality gates (must pass before every PR)

```bash
pnpm verify      # = lint + typecheck + test (what CI runs, see infra/ci/README.md)
pnpm lint        # ESLint + package boundaries (dependency-cruiser) + repo checks (Role headers, folder READMEs, layout)
pnpm typecheck   # TypeScript strict on every package
pnpm test        # Vitest
```

## Repository layout

| Folder | Content |
|---|---|
| `apps/web` | Browser client (Babylon.js, Preact) |
| `apps/gateway`, `apps/zone`, `apps/services` | WebSocket gateway, cell simulation servers, HTTP/bus services |
| `packages/*` | Shared libraries (pure game rules and formats, Node-only bus/logging/db) |
| `tools/*` | Offline tools: OSM → tiles pipeline, content CLI, asset pipeline, load bots, repo checks |
| `content/` | Game content, one definition per JSON file |
| `assets-src/` | Source art (.blend, textures) |
| `docs/` | ADRs, backlog, roadmap, rules, archive |

Every folder has a `README.md` describing its role; every source file starts with a `Role:` header.

## Working with Claude Code

Each developer declares their role once per machine:

```bash
echo frontend > .claude/role.local   # or: echo backend > .claude/role.local
```

Claude then works only inside that role's folders (enforced by a hook). See `CLAUDE.md`.

## Licence

Code licence: to be decided (ARCHITECTURE Q9). Map data © OpenStreetMap contributors, ODbL.
