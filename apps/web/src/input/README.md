# `apps/web/src/input/`

- **Owner:** frontend developer
- **Status:** Active — J1

## Role

Conversion clavier (AZERTY/QWERTY) → `InputIntent` structuré. Module **pur**, testable sans DOM, appelé chaque frame par la game loop.

## How it works

Two files compose the system:

1. **`input-intent.ts`** — Définit le type `InputIntent` partagé entre client, protocole réseau et tests.
2. **`keyboard-intent.ts`** — Convertit l'état clavier brut (Set de codes physiques) en `InputIntent` chaque frame.

Aucune dépendance Babylon ni DOM n'est requise dans `keyboard-intent.ts` : il reçoit un `ReadonlySet<string>` de codes clairs (ex. `'KeyW'`, `'ShiftLeft'`). Le morceau d'attache des listeners DOM se fait une seule fois au démarrage dans `main.ts` ou `scene.onBeforeRender`.

## InputIntent fields

| Field | Type | Description |
|-------|------|-------------|
| `horizontal` | `number` | -1 = gauche, 0 = rien, 1 = droite |
| `vertical` | `number` | -1 = arrière, 0 = rien, 1 = avancer |
| `turn` | `number` | -1 = tourner gauche, 0 = rien, 1 = tourner droite |
| `sprint` | `boolean` | Vrai si Shift est tenu (course) |
| `interact` | `boolean` | Vrai si E/Mission est pressée (action/interaction) |
| `pitch` | `number` | Variation de regard vertical (gérée par souris ou intégrateur séparé) |
| `valid` | `boolean` | Vrai si l'état est exploitable (non stale, dans le debounce) |

## Usage in the game loop

```ts
import { rawToIntent } from './keyboard-intent.ts';
import type { InputIntent } from './intent-input.ts';

const keyState = new Set<string>();
window.addEventListener('keydown', (e) => keyState.add(e.code));
window.addEventListener('keyup', (e) => keyState.delete(e.code));

// Each frame:
const intent: InputIntent = rawToIntent(keyState);
// → intent.horizontal, intent.vertical, etc. utilisés par la logique jeu
```

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
- ✅ Pas de `Math.random` dans ce module (déterministe, utiliser `normalizeAxis`).
- ✅ Types exportés pour tests unitaires (`rawToIntent`, `InputIntent`).
- ✅ Pas de dépendance directe Babylon/DOM (injection de dépendances via paramètres).