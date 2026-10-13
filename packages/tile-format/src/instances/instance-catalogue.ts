/**
 * Role: catalogue of instanced modules (props, vegetation, facade and roof kits): the index written in instances.bin ↔ the asset name the client loads. Append-only, shared by the pipeline and the client.
 * Owner: backend
 */

/**
 * NEVER reorder or remove an entry: tiles store the index. Add new modules at the end.
 * Names follow the asset convention `category_name_variant` (LOD suffix added by the client).
 */
export const INSTANCE_MODULES = [
  'prp_street_light_a',
  'prp_kiosk_a',
  'prp_trash_bin_a',
  'prp_bench_a',
  'prp_bus_stop_sign_a',
  'prp_bus_stop_shelter_a',
  'veg_tree_mango_a',
  'veg_tree_palm_a',
  'veg_tree_generic_a',
  'veg_tree_forest_a',
  'veg_bush_a',
  // Facade bays (T-102): nominal 3 m wide; ground floor 3.5 m high, upper floors 3 m; pivot at the bottom centre of the outer face, facing +z.
  'bld_wall_plain_a',
  'bld_wall_window_a',
  'bld_wall_window_b',
  'bld_balcony_a',
  'bld_gf_wall_plain_a',
  'bld_gf_window_a',
  'bld_door_metal_a',
  'bld_gate_metal_a',
  'bld_shopfront_shutter_a',
  'bld_shopfront_open_a',
  // Flat roof parapet (3 m × 0.8 m, on the roof edge) and roof-top accessories.
  'bld_parapet_a',
  'bld_roof_water_tank_a',
  'bld_roof_rebar_a',
] as const;

export type InstanceModule = (typeof INSTANCE_MODULES)[number];

export const moduleIndex = (name: InstanceModule): number => INSTANCE_MODULES.indexOf(name);
export const moduleName = (index: number): InstanceModule | undefined => INSTANCE_MODULES[index];
