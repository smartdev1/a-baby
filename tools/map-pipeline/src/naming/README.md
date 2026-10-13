# `tools/map-pipeline/src/naming/`

- **Owner:** backend developer
- **Status:** Active — T-111 (ADR 0010)

## Role

Displayed names of places — the only code allowed to produce them.

| File | Role |
|---|---|
| `name-place.ts` | Decision order: override > hidden (offensive word) > **real name** for public places (worship, schools, administrations, markets, stops, sport, parks, hospitals) > **brand parody** > **deformed proper nouns** > generic name kept |
| `brand-parody.ts` | Finds brands in the `brand` tag or in the name's words (accent / case insensitive, longest first) and replaces them; lists unknown `brand` values |
| `deform-name.ts` | 2 letter swaps per proper word (a↔o, c↔k, s↔z, t↔d…), first letter and case kept, seeded by the OSM id |
| `name-text.ts` | Folding, tokenisation, sanitising (no control characters, ≤ 120 chars) |
| `naming-content.ts` | Loads `content/place-names/` (parodies, generic words, offensive words, overrides) |

## Rules

- **An unknown `brand=*` value fails the build** until it is added to `content/place-names/brand-parodies.json` (human review, ADR 0010).
- Displayed names are plain text: the client must render them as text, never as HTML.
