# `tools/map-pipeline/src/stages/06-heights/`

- **Owner:** backend developer
- **Status:** Active — T-011

## Role

`classified.ndjson` → `buildings.ndjson`: one record per building with type, levels, `heightM`, `heightSource` (`osm` | `heuristic`), footprint (UTM MultiPolygon), footprint area and place category. Rules in `src/heuristics/`. Generic buildings without OSM height use the profile of their neighbourhood (`neighbourhoodProfiles` in the commune config); `heights-report.json` gives the buildings per profile and per neighbourhood and the neighbourhoods still without profile (owner review).

Yopougon: 47 539 buildings from neighbourhood profiles (courtyard 20 214, planned houses 19 256, SICOGI 4 306, villages 3 528, industrial 235); 10 359 in 50 neighbourhoods without profile (some outside the commune).
