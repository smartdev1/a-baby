# ADR 0008 — `@babylonjs/core` (modules ES) à la place du paquet UMD `babylonjs`

- **Statut** : Proposée
- **Date** : 13/10/2026

## Contexte

Le client utilise les paquets UMD `babylonjs` et `babylonjs-gui` : bundle de plusieurs Mo sans tree-shaking, et `earcut` non injecté, d'où un repli probable en boîtes englobantes pour tous les bâtiments (cartographie, M1, M2).

## Décision

1. Migrer vers `@babylonjs/core` et `@babylonjs/loaders` (dernière majeure stable au moment de J0), avec des imports explicites et des effets de bord déclarés (chargeurs glTF, KTX2, meshopt).
2. La **triangulation des polygones se fait hors ligne** dans le pipeline (`earcut` côté outils). Le client ne triangule plus.
3. L'UI 2D passe en **Preact** (HTML/CSS) ; Babylon GUI est réservé aux étiquettes dans le monde. `babylonjs-gui` est retiré.
4. WebGL2 est la base ; WebGPU est optionnel, activé seulement après mesure.

## Alternatives écartées

| Option                                             | Raison du rejet                                                                                                           |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Garder l'UMD                                       | Bundle lourd, pas de tree-shaking, earcut à injecter globalement                                                          |
| three.js                                           | Réécriture de l'existant et outillage moins intégré (glTF, KTX2, thin instances, VAT disponibles nativement dans Babylon) |
| Moteur natif exporté en WebAssembly (Unity, Godot) | Bundle lourd, pas de partage de code TypeScript avec le serveur                                                           |

## Conséquences

- Gain attendu : bundle initial gzip réduit d'au moins 50 % (critère de T-013).
- `WorldRenderer.ts` est découpé et réécrit (ARCHITECTURE §26).
