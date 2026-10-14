# `apps/web/src/ui/hud/`

- **Owner:** frontend developer
- **Status:** Active — J1

## Role

Head-up display (HUD) MVP : 5 jauges de besoins, solde Djai, horloge jour/nuit, invite interaction, progression action, notifications, chat de proximité. Tout via i18n, Pas de texte en dur.

## HUD Champs obligatoires (section 6 + §30)

| Champ | Source | Format |
|-------|--------|--------|
| 5 jauges besoins | `needs` JSONB du personnage | Pourcentage 0-100 + icône + label i18n |
| Solde Djai | `wallet_update` événement serveur | Entier bigint + formatage devise (i18n) |
| Horique jour/nuit | `world_clock` WebSocket segment | Jour de jeu + jour réel + ratio (12) |
| Invite interaction | Aperçu non autoritaire d'action | Label i18n + raison grisée (ex. « Fermé — 06:00 ») |
| Proaction action | Machine à états `sim-actions` | Barre de progression + animation |
| Notifications | Système de notification transposable | Clèle i18n + paramètres, jamais texte en dur |
| Chat proximité | Bus WebSocket `chat` | Texte filtré + limite 1 msg/s + rafale 5 |

## Règles de développement (non négociables)

- ✅ **Preact + @preact/signals** : state global via signals, pas de Redux/store complexe MVP
- ✅ **Aucune chaîne en dur** : tout texte joueur passe par `content/i18n/fr-CI/<domaine>.json` ; clés du format `hud.<champ>.<sous_champ>`
- ✅ **AA contraste ≥ AA** : couleurs définies sur `$root` CSS variables, testées en light/dark
- ✅ **Cibles ≥ 44 px** : minimum pour toucher mobile / clavier
- ✅ **Responsive** : HUD se plie en colonne unique sur large < 600 px, horizontal sur > 600 px
- ✅ **Pas de `Math.random`** : tout déterministe ou issu des signals
- ✅ **Tous les imports** : chemins relatifs `@skyline/...` ou `./` ; pas de `utils`/`helpers` fourre-tout
- ✅ **Role header** sur chaque fichier source
- ✅ **Éviter les dépendances** : pas de `lodash`, `moment`, etc. — fonctions pures maison

## Usage dans main.ts

```ts
import { useHUDStore } from './hud/use-hud-store.ts';
import type { HUDState } from './hud/types.ts';

// Dans la game loop :
const hud = useHUDStore.getState();
// hud.needs = { hunger, energy, hygiene, social, entertainment }
// hud.djaiBalance = bigint (lecture seule)
// hud.gameMinute = number (horloge interne)
// hud.interactionPrompt = string | null (grisé + raison)
// hud.notifications = array of { key, duration }
// hud.chatMessage = string | null
```

## Règles d'or HUD

1. **Tout texte = clé i18n** — jamais de `div.innerText = "..."` dur
2. **Couleurs & contraste** : définies dans `src/ui/hud/styles.css` sur `:root` + `@media (prefers-color-scheme: dark)`
3. **Mises à jour** : via WebSocket (`wallet_update`, `needs_update`, `world_clock`, `interaction_prompt`) — pas de polling
4. **Accessibilité** : chaque jauge a `aria-label` avec la clé i18n, rôles `progressbar`, valeurs `aria-valuenow`/`aria-valuemax`/`aria-valuemin`
5. **Pas de téléphone** : feature désactivée au MVP, mais structure prête (placeholder disabled)