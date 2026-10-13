# `packages/sim-clock/src/`

- **Owner:** backend developer
- **Status:** Active — T-109

| File | Role |
|---|---|
| `index.ts` | Public API |
| `clock-segment.ts` | Segments, game minutes, ratio change, pause / resume |
| `game-calendar.ts` | Game date from game minutes |
| `time-windows.ts` | Opening windows, overnight support, `HH:MM` parsing |
| `clock-sync.ts` | Server clock offset from ping / pong samples |
| `clock-config-schema.ts` | Zod schemas of `clock.json` and `calendar.json` |
