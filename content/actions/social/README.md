# `content/actions/social/`

- **Owner:** backend developer (gameplay data)
- **Status:** Draft — T-312 (owner review: prices, durations, hours)

## Role

Chatting, offering a drink, greeting neighbours. One action per file: `<id>.action.json`, validated by `tools/content-cli`.

## Rules

- Ids start with the category; durations and windows are in game time; needs are satisfaction values (positive deltas restore).
