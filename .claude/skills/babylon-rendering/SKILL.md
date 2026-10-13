---
name: babylon-rendering
description: Rules and recipes for SkyLine 3D rendering with Babylon.js (ES modules) — semi-realistic PBR at commune scale, thin instances, LOD, tile streaming, day/night from the server clock, performance budgets. Use when writing or reviewing code in apps/web/src/{engine,streaming,world-render,characters,vehicles,player}.
---

# Babylon.js rendering in SkyLine

## Imports
Always tree-shakable ES modules: `import { Scene } from '@babylonjs/core/scene'`, builders from `@babylonjs/core/Meshes/Builders/<x>Builder`. Side-effect imports when needed (`@babylonjs/core/Meshes/thinInstanceMesh`, `@babylonjs/loaders/glTF`, KTX2 decoder). Never `import * as BABYLON` or the `babylonjs` UMD package.

## World scale and coordinates
- 1 unit = 1 metre, Y up. Tile data `x` = east, `y` = north → Babylon `z`.
- World is UTM 30N metres relative to a tile origin; use a **floating origin** (re-centre around the player) to keep float precision over the whole commune.

## Draw-call discipline (target ≤ ~1500 draw calls, ≥ 30 FPS on low reference PC)
- **Thin instances** for repeated meshes (facade modules, props, trees): one draw call per mesh+material.
- Share materials: one PBR material per family, variations through instance attributes (tint, dirt, texture-array index), never one material per building.
- `freezeWorldMatrix()` and `material.freeze()` on static geometry; `scene.skipPointerMovePicking = true`; disable unused features.
- Merge static per-tile geometry offline (map pipeline), not at runtime.

## LOD and streaming
- Tiles of 250 m, LOD L0–L3 (ARCHITECTURE §10). Load around the player by priority, cancel obsolete loads with `AbortSignal`, decode in web workers, dispose everything of an unloaded tile (meshes, materials, textures) to avoid GPU leaks.
- Far field: impostors / merged low-poly blocks.

## Semi-realistic look (ADR 0005)
- PBR metal/rough, textures in **KTX2** (ETC1S colour, UASTC normals), meshes with **meshopt** — loaded via glTF.
- Sun direction and sky colour from the **internal world clock** (`@skyline/sim-clock` + server segment), never `Date.now()`.
- Shadows: cascaded shadow map only near the player; quality profiles low/medium/high (§12.7).

## Measuring
Every rendering PR reports FPS p5, draw calls, active meshes, GPU memory on the reference scene (use the debug perf overlay / `SceneInstrumentation`). Regression > 10 % is refused.

## Separation
`world-render/` never imports `ui/` (and vice versa). Rendering never decides gameplay.
