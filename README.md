# SKYLINE — Abidjan District

Un jeu d'action 3D en monde ouvert inspiré de GTA, situé dans un quartier urbain fictif d'Abidjan.

## Structure du projet

```
.
├── apps/                     # Applications
│   ├── web/                  # Client 3D (Babylon.js + Vite)
│   │   └── src/
│   │       ├── game/         # Boucle de jeu, scène, caméra
│   │       ├── entities/     # Représentations visuelles
│   │       ├── controls/     # Commandes du joueur
│   │       ├── ui/           # HUD, menus, interactions
│   │       └── network/      # Client réseau
│   │
│   └── server/               # Serveur (Node.js + Colyseus)
│       └── src/
│           ├── rooms/        # Sessions multijoueurs
│           ├── combat/       # Validation des combats
│           ├── missions/     # Progression et objectifs
│           ├── economy/      # Argent, achats, récompenses
│           ├── activities/   # Activités secondaires
│           └── persistence/  # Accès aux données
│
├── packages/                 # Code partagé
│   ├── contracts/            # Types et schémas réseau partagés
│   ├── game-config/          # Configurations validées
│   └── domain/               # Types et règles métier partageables
│
├── tests/                    # Tests
│   ├── unit/                 # Tests unitaires
│   ├── integration/          # Tests d'intégration
│   └── e2e/                  # Tests end-to-end
│
└── docs/                     # Documentation
    ├── architecture.md
    ├── gameplay-rules.md
    └── network-protocol.md
```

## Stack technique

- **Client 3D** : Babylon.js + TypeScript + Vite
- **Serveur temps réel** : Colyseus (gestion des rooms et synchronisation)
- **Backend API** : Node.js + TypeScript + Prisma ORM + PostgreSQL
- **Tests** : Vitest
- **Validation des données** : Zod ou Valibot

## Documentation

Consultez le fichier `CLAUDE.md` pour les règles de développement, les principes architecturaux et le contexte du projet.

## Licence

À définir