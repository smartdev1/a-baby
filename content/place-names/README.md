# `content/place-names/`

- **Owner:** backend developer
- **Status:** Active — T-111

## Role

Naming layer (ADR 0010): `brand-parodies.json` (brand → parody, **to review before each release**: set `reviewedBy`), `generic-words.json` (words never deformed), `offensive-words.json` (names hidden), `overrides/<name>.json` (one OSM object: rename or `null` to remove on request).

## How it works

The big-brand table is reviewed by a human before every release.

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
