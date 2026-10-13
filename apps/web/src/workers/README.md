# `apps/web/src/workers/`

- **Owner:** frontend developer
- **Status:** Planned — J1

## Role

Web workers: tile decoding and instance buffer preparation off the main thread.

## How it works

Messages between workers and the main thread use transferable buffers.

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
