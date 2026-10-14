# `docs/previews/`

- **Owner:** shared
- **Status:** Active

## Role

Screenshots that show the state of the world at a milestone, so the team can follow progress without running the pipeline.

| Image | Content |
|---|---|
| `j2-yopougon-overview-l3.jpg` | **The whole commune from the 102 L3 tiles only** (T-202, 2 km tiles, 4.8 MB in total): relief on a 40 m grid, lagoon, primary/secondary roads, buildings as 40 m block impostors. Same framing as the L1 overview. © OpenStreetMap contributors (ODbL); relief © Copernicus |
| `j1-yopougon-overview-l1.jpg` | **The whole commune** from the 1 213 L1 tiles (T-105): relief, dense centre, main roads, lagoon to the south. Known artefacts: water row moiré at distance, missing border tiles without data. © OpenStreetMap contributors (ODbL); relief © Copernicus |
| `j1-yopougon-terrain.jpg` | Central Yopougon (`L0_312..330 × 184..197`, 266 tiles) after T-103: real relief from Copernicus GLO-30 (filtered to bare ground, roads levelled), buildings seated on the ground, roads draped, seamless tiles. Map data © OpenStreetMap contributors (ODbL); relief © Copernicus (DLR / Airbus, EU / ESA) |
| `j0-yopougon-tiles-1to1.png` | **Superseded** — taken before the glTF frame fix of T-103: each tile was mirrored (invisible on flat ground). Kept for history. | 72 real L0 tiles of central Yopougon (`L0_319..327 × 196..203`) produced by `pnpm map:build` (T-012), loaded with Babylon's glTF loader: 1:1 scale, real footprints, heuristic heights, roads at class width. Flat placeholder colours (no facade kits yet). Map data © OpenStreetMap contributors, ODbL |

## Rules

- Keep images small (≤ 500 KB) and say how they were produced.
