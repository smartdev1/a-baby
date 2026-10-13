# `packages/tile-format/src/instances/`

- **Owner:** backend developer (shared contract, reviewed by the frontend)
- **Status:** Active — T-104

## Role

| File | Role |
|---|---|
| `instance-catalogue.ts` | `INSTANCE_MODULES`: index ↔ asset name (`prp_street_light_a`, `veg_tree_mango_a`, facade bays `bld_*`…). **Append-only**: tiles store the index. Single list shared by the pipeline and the client |
| `instances-codec.ts` | `instances.bin` v2: `SKYI` header + per instance module u16, position f32 × 3 (tile-local metres), yaw u16, scale u8 (0.5–2.0), variant u8 (facades: tint bits 0–3, dirt bits 4–7), stretchX u8 and stretchY u8 (0.5–2.0, facade bays fitted to the wall). v1 still decodes (stretch 1). Bounded decoder (typed errors, fuzzed) |

The client renders each module with thin instances (one draw call per module and tile). Instance matrix = translate(x, y, z) · rotateY(yaw) · scale(scale × stretchX, scale × stretchY, scale).

### Facade module contract (frontend kit, J1-06)

| Module | Size (w × h, m) | Where |
|---|---|---|
| `bld_wall_plain_a`, `bld_wall_window_a`, `bld_wall_window_b`, `bld_balcony_a` | 3 × 3 | Upper floors |
| `bld_gf_wall_plain_a`, `bld_gf_window_a`, `bld_door_metal_a`, `bld_gate_metal_a`, `bld_shopfront_shutter_a`, `bld_shopfront_open_a` | 3 × 3.5 | Ground floor |
| `bld_parapet_a` | 3 × 0.8 | Edge of flat roofs |
| `bld_roof_water_tank_a`, `bld_roof_rebar_a` | — (real size) | On flat roofs |

Pivot at the bottom centre of the outer face, the module faces +z (outwards), 1 unit = 1 m. Bays are stretched to the wall (`stretchX` 0.75–1.5) and floors to the building height (`stretchY`).
