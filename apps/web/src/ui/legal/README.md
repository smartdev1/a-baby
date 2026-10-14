# `apps/web/src/ui/legal/`

- **Owner:** frontend developer
- **Status:** Active — J1

## Role

Legal screen family: guest home, recovery code, legal notices, settings. All texts via i18n, ARIA accessible, pas de Math.random.

## Screen Components

| Fichier | Description |
|---|---|
| `guest-home.tsx` | Écran d'accueil invité — 3 options : nouvelle partie, récupérer, mentions légales |
| `legal-notices.tsx` | Mentions légales — attribution OSM, confidentialité, conditions |
| `recovery-code.tsx` | Code de récupération — affichage + bouton de copie |
| `settings.tsx` | Paramètres — qualité graphique, préréglages de touches |

## Règles communes à tous les écrans legal

- ✅ **Tout texte = clé i18n** — jamais de texte en dur (`legal.xxx`, `settings.xxx`, `guest.xxx`)
- ✅ **ARIA complet** — `role` et `aria-label` sur les conteneurs principaux
- ✅ **Pas de `Math.random`** — affichage déterministe ou issu des signaux
- ✅ **Responsive** — les conteneurs seCentrent horizontalement, largeur max 600px
- ✅ **Role header** sur chaque fichier source
- ✅ **Pas de dépendances lourdes** — uniquement `@preact/signals-react` et `use-hud-store.ts`

## Usage dans main.ts

```ts
import { renderLegalNotices, renderRecoveryCode, renderSettings, renderGuestHome } from './legal/';
// Dans la UI de l'écran correspondant :
// renderLegalNotices(target);
// renderRecoveryCode(target);
// renderSettings(target);
// renderGuestHome(target)
```