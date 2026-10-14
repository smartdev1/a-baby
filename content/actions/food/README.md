# `content/actions/food/`

- **Owner:** backend developer (gameplay data)
- **Status:** Active — T-301 (samples), wave A in J3-13

## Role

Eating and drinking (garba, alloco, bissap…). One action per file: `<id>.action.json`, validated by `tools/content-cli` against `@skyline/content-schema`.

## Rules

- Ids start with the category (`food.`); durations and windows are in game time.
- Needs are satisfaction values (100 = satisfied): positive deltas restore a need.
