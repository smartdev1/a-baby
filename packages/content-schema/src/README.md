# `packages/content-schema/src/`

- **Owner:** backend developer
- **Status:** Skeleton — J3

## Role

| File | Role |
|---|---|
| `content-ids.ts` | Content ids (`category.name_snake`), i18n keys, game times `HH:MM`, time windows (may cross midnight), need ids |
| `needs-schema.ts` | `needs.config.json`: start, decay per game hour, warning level, penalties at 0 |
| `effect-schemas.ts` | Effect registry (MVP): `need`, `buff`, `notification`, `money` (economy legs), `skill_xp`, `item_add`, `item_remove` |
| `action-schema.ts` | Action file (ARCHITECTURE §15.3): where, when, requires, cost, duration + ellipse, phases, effects, outcomes, participants, provider |
| `place-type-schema.ts` | Place types: OSM game categories, action sites (kind, capacity, placement), opening hours, NPC roles, sanctuary |
| `job-item-schemas.ts` | NPC jobs and items |
| `json-schemas.ts` | JSON Schemas generated from Zod (`io: input`) |

Needs are **satisfaction** values: 100 = satisfied, 0 = empty (penalties). Eating adds to `hunger`.

## How it works

Unit tests live next to the code (`*.test.ts`).

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
