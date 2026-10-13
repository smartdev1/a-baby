# `packages/tile-format/src/instances/`

- **Owner:** backend developer (shared contract, reviewed by the frontend)
- **Status:** Active — T-104

## Role

| File | Role |
|---|---|
| `instance-catalogue.ts` | `INSTANCE_MODULES`: index ↔ asset name (`prp_street_light_a`, `veg_tree_mango_a`…). **Append-only**: tiles store the index |
| `instances-codec.ts` | `instances.bin` v1: `SKYI` header + per instance module u16, position f32 × 3 (tile-local metres, y from the terrain), yaw u16, scale u8 (0.5–2.0), variant u8. Bounded decoder (typed errors, fuzzed) |

The client renders each module with thin instances (one draw call per module and tile).
