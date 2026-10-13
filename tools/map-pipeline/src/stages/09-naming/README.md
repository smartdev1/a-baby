# `tools/map-pipeline/src/stages/09-naming/`

- **Owner:** backend developer
- **Status:** Active — T-111

## Role

`classified.ndjson` + `content/place-names/` → `place-names.ndjson` (`id`, `displayName`, `source`) and `naming-report.json`. Stage 14 copies the names into the tiles' `meta.json`.

Yopougon: 17 925 places — 3 383 real toponyms, 843 brand parodies, 4 302 deformed names, 4 448 generic names kept, 4 949 unnamed; 1.2 s.
