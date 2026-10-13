# `packages/physics/src/`

- **Owner:** backend developer
- **Status:** Active — T-106

## Role

| File | Role |
|---|---|
| `index.ts` | Public API |
| `physics-types.ts` | `Vec3`, `CharacterState`, `MoveInput`, tuning `DEFAULT_CHARACTER`, `FIXED_STEP_S` |
| `collision-world.ts` | Tiles in a common frame: ground height, prism grid queries |
| `polygon-math.ts` | Point-in-polygon, closest boundary point, circle push-out |
| `character-controller.ts` | `stepCharacter`, `supportHeightAt` |
