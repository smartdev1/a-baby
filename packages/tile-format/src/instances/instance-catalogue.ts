/**
 * Role: catalogue of instanced modules (props, vegetation, later facade kits): the index written in instances.bin ↔ the asset name the client loads. Append-only.
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
] as const;

export type InstanceModule = (typeof INSTANCE_MODULES)[number];

export const moduleIndex = (name: InstanceModule): number => INSTANCE_MODULES.indexOf(name);
export const moduleName = (index: number): InstanceModule | undefined => INSTANCE_MODULES[index];
