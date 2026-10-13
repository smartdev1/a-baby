# `content/game-config/`

- **Owner:** backend developer
- **Status:** Active — T-109

## Role

Game parameters: `clock.json` (`ratio` = game minutes per real minute, 12 ⇒ 1 game day = 2 real hours; `initialGameMin` = game time at the very first start, 360 = day 0 at 06:00) and `calendar.json` (weekday i18n keys, month lengths, start year). Validated by `@skyline/sim-clock` schemas.

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
