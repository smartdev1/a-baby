# `tools/map-pipeline/src/stages/12-props/`

- **Owner:** backend developer
- **Status:** Active — T-104

## Role

Buildings + road graph + classified features → `props.ndjson` (placed instances) + `props-report.json`. Stage 14 assigns them to tiles; stage 16 sets their height from the terrain, drops those on water and writes `instances.bin`.

Yopougon: 449 635 instances (35 408 street lights, 973 kiosks + bins, 1 858 bus stops, ≈ 313 000 trees, 96 517 bushes) in 2 569 tiles; 21 s.
