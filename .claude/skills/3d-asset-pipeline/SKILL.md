---
name: 3d-asset-pipeline
description: Produce SkyLine 3D assets ourselves (no external artist) — Blender modelling conventions, glTF export, optimization with glTF Transform (meshopt, KTX2), LODs, budgets and licence registry. Use when creating, importing, checking or optimizing a 3D model, texture or animation.
---

# 3D assets in SkyLine (made in-house)

## Conventions (checked by tools/asset-pipeline)
- Name: `category_name_variant_lod` — e.g. `bld_shopfront_shutter_b_lod0`, `veh_gbaka_green_lod1`, `prp_kiosk_orange_lod0`. Categories: `bld`, `chr`, `prp`, `veh`, `veg`, `mat`.
- **1 unit = 1 metre**, Y up in glTF (Blender Z up is converted by the exporter), **pivot on the ground** at the object footprint centre (buildings modules: bottom-left of the module grid).
- Apply transforms before export; no negative scale; triangulated.
- Modular facade kits on a **3 m grid** (ground floor 3.5 m) so the pipeline can assemble any OSM footprint.
- **No real brand logos or colour charts** (ADR 0010): parodied signs only.

## Budgets (indicative, ARCHITECTURE §12)
| Asset | LOD0 tris | Textures |
|---|---|---|
| Facade module | ≤ 500 | shared atlas / texture array |
| Prop | ≤ 300 | shared atlas |
| Vehicle | ≤ 8 000 | 1 × 1024² set |
| Character (assembled) | ≤ 12 000 | 1 × 1024² set |
LOD1 ≈ 50 %, LOD2 ≈ 15 %, far field = impostor.

## Workflow
1. Model in Blender (source `.blend` in `assets-src/<category>/`, Git LFS).
2. Export glTF binary (`.glb`): +Y up, apply modifiers, PBR metal/rough materials, no embedded lights/cameras.
3. Optimize: `pnpm --filter @skyline/asset-pipeline start <file.glb>` (in progress) — uses glTF Transform: `dedup`, `prune`, `weld`, `simplify` (LODs), `meshopt` compression, textures → **KTX2** (ETC1S for colour, UASTC for normal maps; requires `toktx` from KTX-Software installed on the machine).
4. Check in the game with the debug scene: scale, pivot, draw calls, FPS.
5. Register the asset and its licence in the asset registry (CC0 / own work only; no GPL; keep the source of any CC-BY asset).

## Required machine tools (install once)
- Blender (≥ 4.x): `sudo snap install blender --classic` (Linux) / installer (Windows).
- KTX-Software (`toktx`) for KTX2 textures.
- Git LFS (`sudo apt install git-lfs && git lfs install`) for `.blend` and source textures.

## Free sources (check licence each time)
Poly Haven (CC0 textures/HDRI), ambientCG (CC0 materials), Quaternius / Kenney (CC0 low-poly bases to rework). Photo references of Yopougon are collected with the owner.
