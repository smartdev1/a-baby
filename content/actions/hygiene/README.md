# `content/actions/hygiene/`

- **Owner:** backend developer (gameplay data)
- **Status:** Active — T-301 (samples), wave A in J3-13

## Role

Washing, brushing, laundry. One action per file: `<id>.action.json`, validated by `tools/content-cli` against `@skyline/content-schema`.

## Rules

- Ids start with the category (`hygiene.`); durations and windows are in game time.
- Needs are satisfaction values (100 = satisfied): positive deltas restore a need.
