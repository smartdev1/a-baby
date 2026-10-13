# SKYLINE — Abidjan District

Un jeu d'action 3D en monde ouvert inspiré de GTA, situé dans un quartier urbain fictif d'Abidjan.

## 🏗️ Architecture du projet

Cette implémentation suit une architecture spécialisée pour les jeux 3D web complexes, avec une séparation claire des préoccupations :

```
.
├── apps/                     # Applications exécutables
│   ├── web/                  # Client 3D (Babylon.js + Vite)
│   │   ├── src/
│   │   │   ├── game/         # Boucle de jeu, scène, caméra
│   │   │   ├── entities/     # Représentations visuelles des objets du jeu
│   │   │   ├── controls/     # Commandes du joueur (input, mouvement)
│   │   │   ├── ui/           # HUD, menus, interactions
│   │   │   ├── network/      # Client réseau (Colyseus)
│   │   │   └── world/        # 🌍 Organisation spécialisée du monde 3D
│   │   │       ├── loading/  # Chargement progressif par secteur
│   │   │       ├── roads/    # Système de routage et de navigation
│   │   │       ├── buildings/# Modules de bâtiments et architecture
│   │   │       ├── props/    # Accessoires et éléments de décor
│   │   │       ├── materials/# Gestion centralisée des matériaux/shaders
│   │   │       └── collision/# Géométrie de collision séparée du visuel
│   │   ├── index.html
│   │   └── ...
│   │
│   └── server/               # Serveur (Node.js + Colyseus)
│       ├── src/
│       │   ├── rooms/        # Sessions multijoueurs (Colyseus Rooms)
│   │   │   ├── combat/       # Validation des combats et logique de tir
│   │   │   ├── missions/     # Progression et objectifs de mission
│   │   │   ├── economy/      # Argent, achats, récompenses
│   │   │   ├── activities/   # Activités secondaires (livraison, recherche, service)
│   │   │   └── persistence/  # Accès aux données (Prisma + PostgreSQL)
│   │   └── index.ts          # Point d'entrée du serveur
│   │
│   └── ...
│
├── packages/                 # Code partagé entre client et serveur
│   ├── contracts/            # 📜 Types et schémas réseau partagés (TypeScript)
│   │   └── src/
│   │
│   ├── world-generator/      # 🏗️ Génération procédurale du monde (isolée)
│   │   └── src/
│   │       ├── importers/    # Import et traitement des assets
│   │   │   ├── projection/   # Projection terrain et coordonnées
│   │   │   ├── roads/        # Génération procédurale des routes
│   │   │   ├── buildings/    # Placement procédural des bâtiments
│   │   │   └── placement/    # Placement général d'objets et de détails
│   │
│   ├── domain/               # 💾 Types et règles métier partageables
│   └── game-config/          # ⚙️ Configurations validées du jeu
│
├── data/                     # 📁 Pipeline d'assets (selon les meilleures pratiques)
│   ├── source/               # Assets bruts (.blend, textures sources, références)
│   ├── processed/            # Assets intermédiaires (après traitement)
│   └── generated/            # Assets finaux (glTF optimisé, KTX2 compressé)
│
├── public-assets/            # 📦 Modèles GLB, textures, sons prêts pour l'usage
│
├── config/                   # ⚙️ Configuration des outils
│   ├── vite/                 # Configuration Vite
│   ├── typescript/           # Configuration TypeScript
│   └── prisma/               # Configuration Prisma
│
├── .claude/                  # 🤖 Configuration des agents Claude Code
│   ├── agents/               # Définitions des rôles d'agents
│   └── settings.json
│
├── docs/                     # 📚 Documentation technique
│   ├── architecture.md
│   ├── gameplay-rules.md
│   └── network-protocol.md
│
├── tests/                    # �Tests
│   ├── unit/                 # Tests unitaires
│   │   ├── apps/             # Tests des applications web/server
│   │   └── packages/         # Tests des packages partagés
│   ├── integration/          # Tests d'intégration
│   │   ├── network/          # Tests client-serveur
│   │   └── gameplay/         # Tests de règles métier
│   └── e2e/                  # Tests end-to-end
│
├── .env.example              # Exemple de variables d'environnement
├── .gitignore                # Configuration Git
├── CLAUDE.md                 # Règles de développement et principes architecturaux
├── package.json              # Configuration racine (workspaces, scripts)
└── README.md                 # Ce fichier
```

## 🧱 Principes architecturaux

Cette structure implémente les principes suivants :

1. **Séparation des préoccupations (SoC)** : Le rendu 3D, la logique de jeu, le réseau et la génération procédurale sont clairement séparés
2. **Responsabilité unique (SRP)** : Chaque module a une responsabilité bien définie
3. **Dependencies inversées (DIP)** : Le métier dépend des abstractions (contracts), pas des implémentations concrètes
4. **Composition plutôt qu'héritage** : Les comportements sont composés à partir de capacités simples
5. **Configuration pilotée par les données** : Les statistiques, récompenses et paramètres sont dans des configurations validées
6. **Typage strict** : Utilisation de TypeScript avec `strict: true` partout
7. **Tests automatisés** : Structure prête pour les tests unitaires, d'intégration et end-to-end
8. **Observabilité** : Journalisation structurée prévue pour les erreurs importantes et les événements de jeu
9. **Sécurité par défaut** : Validation stricte des inputs clients, jamais de confiance dans les données côté client pour la logique critique

## 🚀 Stack technique

- **Client 3D** : Babylon.js + TypeScript + Vite
- **Serveur temps réel** : Colyseus (gestion des rooms et synchronisation)
- **Backend API** : Node.js + TypeScript + Prisma ORM + PostgreSQL
- **Tests** : Vitest (configuration à venir)
- **Validation des données** : Zod ou Valibot (à venir)

## 📦 Installation

```bash
# Installer les dépendances
npm install

# Copier l'exemple d'environnement
cp .env.example .env

# Configurer la base de données dans .env
# Ensuite initialiser la base de données
npx prisma migrate dev --name init

# Lancer en développement
npm run dev
```

## 🎯 Prochaine phase de développement

Cette structure fournit une base solide pour la **Phase 1 du CDC (Customer Development Cycle)** définie dans les documents du projet :

1. **Blockout jouable** : Quartier de base avec volumes gris et collisions
2. **Personnage jouable** : Mouvement de base (ZQSD/WASD, saut, course, accroupissement)
3. **Caméra TPS/FPS** : Bascule avec touche V
4. **Système d'interaction** : Détection de proximité des PNJ avec touche E
5. **HUD de base** : Affichage de la santé, munitions et Djai
6. **Première fonctionnalité réseau** : Connexion, déplacement basique et mise à jour d'état

## 📄 Licence

À définir

---
*Structure conçue pour respecter les principes de développement énoncés dans CLAUDE.md et optimisée pour un jeu 3D web complexe en monde ouvert.*