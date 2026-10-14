# `apps/web/src/world-render/far-field/`

- **Owner:** frontend developer
- **Status:** Active — J2

## Role

Distant LOD 2-3 rendering and building impostors. Gère l'affichage des objets éloignés (
distance > 100m) avec niveaux de détail réduits pour maintenir ≥ 30 FPS sur PC modeste.

## Composants

| Fichier | Description |
|---|---|
| `impostors.tsx` | Remplace les bâtiments éloignés par des sprites 2D |
| `lod-manager.tsx` | Gère le passage entre LOD proche et distant |
| `tree-instance.tsx` | Instance d'arbre distant avec billboard |

## Règles communes à far-field

- ✅ **LOD progressif** — 3 niveaux de détail (LOD0 = plein, LOD2 = impostor)
- ✅ **Pas de `Math.random`** — placement déterministe ou issu de la génération de monde
- ✅ **Impostors Billboard** — textures orientées vers la caméra pour les objets éloignés
- ✅ **Seuils de distance** — définis dans `vegetation-types.ts` et `building-types.ts`
- ✅ **Role header** sur chaque fichier source
- ✅ **Performance first** — chaque composant visé ≤ 1ms de calcul par frame

## Integration with main loop

Le `FarFieldManager` est initialisé une fois au démarrage et mis à jour chaque frame :
```ts
const farField = renderFarField(document.getElementById('render-canvas')!);
farField.update(camera.position, engine.getFps());
```