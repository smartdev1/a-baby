# `tools/content-cli/schemas/`

- **Owner:** backend developer
- **Status:** Generated — T-304

## Role

JSON Schemas of the content files (`action`, `place-type`, `job`, `item`, `needs`, `transport-service`), **generated** from the Zod schemas of `@skyline/content-schema` by `pnpm content:schemas`. Content files point to them with `$schema` for editor autocompletion. Never edit them by hand: change the Zod schema and regenerate.
