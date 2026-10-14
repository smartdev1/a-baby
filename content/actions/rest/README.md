# `content/actions/rest/`

- **Owner:** backend developer (gameplay data)
- **Status:** Active — T-301 (samples), wave A in J3-13

## Role

Sleeping (with ellipse), naps, sitting in the shade. One action per file: `<id>.action.json`, validated by `tools/content-cli` against `@skyline/content-schema`.

## Rules

- Ids start with the category (`rest.`); durations and windows are in game time.
- Needs are satisfaction values (100 = satisfied): positive deltas restore a need.
