# `assets-src/`

- **Owner:** frontend developer
- **Status:** Planned — J1

## Role

Source art files (.blend, source textures, references). Never served as-is.

## How it works

Exported to glTF then optimized by `tools/asset-pipeline` (meshopt, KTX2). Naming: `category_name_variant_lod`, 1 unit = 1 metre, pivot on the ground. Large binaries go to Git LFS once installed.

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
