# `tools/map-pipeline/src/heuristics/`

- **Owner:** backend developer
- **Status:** Active — T-011 (default profile); neighbourhood profiles in J2

## Role

Plausible values when OSM is silent — first of all building heights (98.7 % missing in Yopougon, spike SP2).

## How it works (`height-heuristics.ts`)

1. `height` tag → source `osm` (levels derived if absent).
2. `building:levels` → source `osm`, height = 3.5 m ground floor + 3 m per upper floor.
3. Otherwise source `heuristic`: single-volume types (church, mosque, warehouse, kiosk…) draw a height range; other types draw levels from a weighted distribution by type (`apartments` R+2..R+5…) or, for `building=yes`, by footprint area. Draws use `rngFor(seed, osmId)`: the same building always gets the same height.

Yopougon result (snapshot 2026-10-01): 74 702 buildings, 1 240 from OSM, 73 462 heuristic; 59 % 1 level, 28 % 2, 10 % 3.

## Rules

- Changing a distribution changes outputs: bump `06-heights` version and update the golden hashes.

## Neighbourhood profiles (T-205)

- `neighbourhood-index.ts`: neighbourhood of a point from OSM `place=*`: containing `neighbourhood`/`quarter` polygon, else nearest `neighbourhood`/`quarter`/`village`/`hamlet`/`locality` point, else nearest `suburb` point, within `maxPointDistanceM` (suburb polygons are commune-sized and ignored).
- `height-heuristics.ts`: generic buildings (`yes`, `residential`, `house`, `detached`, `semidetached_house`, `terrace`) without OSM height, ≥ `minFootprintM2`, draw their levels (or height) in their neighbourhood's profile; other types keep the type / area heuristics.
- Profiles and the name table: `tools/map-pipeline/config/yopougon.neighbourhoods.json` (`src/config/neighbourhood-profiles.ts`).
