# `tools/map-pipeline/src/facades/`

- **Owner:** backend developer
- **Status:** Active — T-102

## Role

Facades and roofs of every building, generated offline (ARCHITECTURE §12.2): instance lists, not meshes.

| File | Role |
|---|---|
| `facade-profile.ts` | Profile from the OSM type, place category and levels: `commercial`, `apartments`, `courtyard` (single-family / courtyard housing), `public`, `industrial` |
| `wall-layout.ts` | Bays of 2.25–4.5 m (nominal 3 m, `count = round(L / 3)`), walls < 2.5 m stay blank; ground floor 3.5 m, upper floors ≈ 3 m fitted to the height; buildings < 2.8 m get no facade |
| `facade-grammar.ts` | Seeded weighted grammar per profile: ground floor on a street (shops on commercial buildings) or on a side, one upper-floor module per column (same on every floor), entrance (gate for courtyards and industry, metal door otherwise) |
| `roof-choice.ts` | Flat roof, or sheet metal (mono-pitch on narrow buildings, dual-pitch otherwise) over the oriented rectangle, for simple, rectangular (≥ 0.85), small buildings inside one tile, with odds per profile (industry 90 %, courtyard 55 %, commercial 35 %, public 30 %, apartment blocks 0 %) |
| `facade-builder.ts` | Building → instances: each outer wall's bays (ground, upper floors, parapet on flat roofs), entrance on the longest street wall, water tank and rebar on flat roofs; tint per building, dirt per bay (`variant`) |

## How it works

- A wall is a street wall when a car road lies within 6 m of the point 6 m in front of its middle.
- Seed: `rngFor(config.seed, "facade:<osm id>")`, so one building always looks the same, and changing a neighbour does not change it.
- Instances carry an absolute height (`yM`: building base + floor) and a stretch (`stretchX` = bay width / 3 m, `stretchY` = floor height / module height). Module names and sizes: `@skyline/tile-format` `INSTANCE_MODULES` (README there: facade module contract).
- Courtyard walls (footprint holes) and walls shorter than a bay stay as plain geometry in `geom.glb`.

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
