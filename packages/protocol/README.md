# `packages/protocol/`

- **Owner:** backend developer
- **Status:** Skeleton — J1

## Role

Client <-> gateway network protocol: version, message types, bounded binary codecs, error codes.

## How it works

Public API is exported from `src/index.ts` only. Profile: `pure`. First implementation: J1.

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
