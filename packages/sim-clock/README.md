# `packages/sim-clock/`

- **Owner:** backend developer
- **Status:** Active — T-109

## Role

The internal world clock of SkyLine (ADR 0011) — the game has its own time, not the real time of Abidjan. Pure package (dep: `zod`).

## How it works

- **Clock segment** `{ realStartMs, gameStartMin, ratio, paused }`: game minutes = `gameStartMin + (now − realStartMs) / 60 000 × ratio`. Changing the ratio, pausing or resuming starts a new segment at the current game time, so time never jumps. Default ratio 12 ⇒ **1 game day = 2 real hours** (`content/game-config/clock.json`).
- **Calendar** (`content/game-config/calendar.json`): year, month, day, weekday (i18n key), hour, minute.
- **Time windows**: opening hours in game minutes, including overnight windows (maquis 18:00 → 04:00).
- **Client sync**: `estimateServerOffsetMs(ping/pong samples)` — the client shows the server's game time, never its own clock.

The server holds the segment (`apps/services` module `world-clock`) and sends it to clients (`world_clock` protocol message, `GET /api/v1/world-clock`).

## Rules

- No game rule uses `Date.now()` or `new Date()` (ESLint rule on `sim-*`, `economy-rules`, `business-rules`).
- Every source file starts with a `Role:` header comment; keep this README up to date.
