# `content/transport/services/`

- **Owner:** backend developer
- **Status:** Active — T-316 (values to review by the owner)

## Role

One service profile per line mode `<mode>.service.json` (schema `transport-service`, `@skyline/content-schema`): visible speed, dwell at stops, seats, flat fare, headway per period of the game day. `sim-transport` applies the profile of its mode to every line of the pipeline (`transit-lines.ndjson`); per-line overrides will go to `../lines/`.

| File | Mode |
|---|---|
| `gbaka.service.json` | Gbaka (minibus) |
| `woro_woro.service.json` | Woro-woro (communal shared taxi) |
| `sotra_bus.service.json` | SOTRA bus |
| `bus.service.json` | Other bus lines |

Speeds are what players see in real time; the timetable converts them with the nominal clock ratio (`game-config/clock.json`), so a live ratio change never moves the vehicles. Headways and dwells are in game minutes.

## Rules

- Keep this README up to date when the folder content changes.
- Validate with `pnpm content:validate`.
