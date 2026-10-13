# Proposition de texte pour la section « Contexte projet » de CLAUDE.md

**Objectif** : Remplacer le contexte projet actuel par une version structurée alignée sur ADR 0001, sans modifier CLAUDE.md directement. Le propriétaire validera cette proposition puis appliquera les modifications.

## Contexte projet actuel (tel que lu dans CLAUDE.md)

```markdown
**Client** : Projet indépendant / développeur individuel
**Objectif** : Créer un MVP d'un jeu d'action 3D web inspiré de GTA, situé dans un quartier urbain fictif d'Abidjan. Le joueur explore librement, interagit avec des PNJ, accomplit des missions, combat des ennemis et gagne la monnaie fictive du jeu (Djai).
**Contraintes** :

- Plateforme cible : Navigateur web sur ordinateur (clavier / souris)
- Aucun véhicule conduisible dans le MVP
- Aucun système de police ou de poursuite dans le MVP
- Quartier de jeu compact : 300m × 300m (environ 9 hectares)
- Sessions multijoueur : 8 joueurs maximum par session (test jusqu'à 12)
- Missions et objectifs strictement individuels (entités de mission privées à chaque joueur)
- Monnaie virtuelle : Le Djai (aucune valeur réelle)
  **Stack retenue** :
- Moteur 3D : Babylon.js
- Langage : TypeScript
- Build : Vite
- Réseau temps réel : Colyseus (gestion des rooms et synchronisation)
- Runtime serveur : Node.js
- API backend : Node.js + TypeScript avec Prisma ORM
- Base de données : PostgreSQL
- Tests unitaires : Vitest
- Validation des données : Bibliothèque de schémas (Zod/Valibot à choisir)
- Observabilité : Logs structurés et métriques
  **Public cible** : Joueurs sur ordinateurs de gamme variée (de l'entrée de gamme aux configurations moyennes)
  **Délais** :
- Développement solo : environ 9-14 mois avec approche hybride (assets "héros" et "kit" internes, "fond" sous licence)
- Avec petite équipe : basé sur le découpage en lots (Lot 0: 2-3 semaines, Lot 1: 7-10 semaines, Lot 2: 13-21 semaines)
- Méthodologie : Alignement sur les phases du CDC (Customer Development Cycle) définies dans les documents de projet
```

## Proposition de nouvelle section « Contexte projet » pour CLAUDE.md

```markdown
**Client** : Projet indépendant / développeur individuel (Aristide Adouko)
**Objectif** : Construire un moteur de simulation de vie virtuelle dans la commune entière de Yopougon (Abidjan) à l'échelle réelle 1:1 à partir de données OpenStreetMap. Les joueurs y mènent une vie quotidienne : travail, logement, commerce, mobilité, interactions sociales. Monde persistant, unique, extensible sans réécriture de code. Français (locale `fr-CI`) avec du nouchi dans les dialogues de PNJ, i18n dès le départ : aucun texte en dur. Économie idempotente en Djai (fictive, sans valeur réelle).
**Contraintes** :

- Plateforme cible : Navigateur web sur ordinateur (clavier / souris), architecture prête pour le mobile
- Serveur autoritaire : le client envoie des intentions, jamais d'état final
- Économie idempotente : toute écriture Djai passe par `EconomyPort.commit` avec clé d'idempotence
- RGPD et loi ivoirienne 2013-450 : minimisation des données, droits d'accès/rectification/suppression, hébergement en Europe soumis à autorisation
- ODbL : attribution visible, séparation des couches (`osm-derived` vs `game-authored`), publication de la base dérivée
- Français (locale `fr-CI`) avec du nouchi dans les dialogues de PNJ, registre `standard` | `nouchi` ; i18n dès le départ : aucune chaîne en dur dans le code (lint `no-literal-string`)
- ≥ 30 FPS sur PC modeste (machine de référence H5)
- Pas de véhicule conduisible dans le MVP, pas de système de police ou de poursuite
- Quartier de jeu compact : 300m × 300m (environ 9 hectares) en MVP, extensible à toute la commune
- Sessions multijoueur : 8 joueurs maximum par session (test jusqu'à 12), monde unique persistant
- Monnaie virtuelle : Le Djai (aucune valeur réelle, pas de conversion réelle possible)
- Horloge interne du monde, ratio configurable (1 jour de jeu = 2 h réelles par défaut), segment d'horloge authoritative
- Pas de Kubernetes, pas de microservices multiples, pas de Redis/Celery/Docker avant validation de l'algorithme de fingerprinting en local
- Pas de scaling à 1 million de morceaux dès le départ, pas de suppression ou de contournement du fallback ARCCloud
  **Stack retenue** :
- Moteur 3D : `@babylonjs/core` (ES modules, dernière majeure stable)
- Langage : TypeScript `strict` partout
- Build : Vite
- Réseau temps réel : Passerelle WebSocket maison + NATS (cellules spatiales, transfert transparent), Colyseus retiré (section 3.6 ARCHITECTURE.md)
- Runtime serveur : Node.js 24 LTS
- API HTTP : Fastify
- Base de données : PostgreSQL 16+
- ORM : Prisma (avec SQL brut paramétré pour le grand livre)
- Tests : Vitest + fast-check (propriétés) + Playwright (e2e)
- Validation : Zod v4 (schémas, frontières)
- Observabilité : pino (logs JSON), OpenTelemetry (métriques, traces), Prometheus + Grafana + Loki
- Conteneurisation : Docker / docker-compose
- Monorepo : pnpm workspaces
- Packages pures : `@skyline/i18n`, `@skyline/geo`, `@skyline/physics`, `@skinline/content-schema`, etc.
- Validation des données : Bibliothèque de schémas Zod
  **Public cible** : Joueurs sur ordinateurs de gamme variée (de l'entrée de gamme aux configurations moyennes), francophones et diaspora ivoirienne
  **Délais** :
- Développement solo : approche jalons J0→J7, environ 9-14 mois avec artiste freelance à partir de J1
- Avec petite équipe : découpage en lots (Lot 0: 2-3 semaines, Lot 1: 7-10 semaines, Lot 2: 13-21 semaines)
- Méthodologie : Alignement sur les phases du CDC (Customer Development Cycle) définies dans les documents de projet, roadmap.md
```

## Décisions et compromis

- **Colyseus → NATS/passerelle maison** : Colyseus n'est plus adapté à un monde sans salles avec transfert transparent entre cellules (voir ARCHITECTURE.md §3.6). Le changement est structurant mais nécessaire pour l'architecture MMO.
- **i18n dès le départ** : Plutôt que d'ajouter l'i18n en v2, il est posé comme fondation (T-021) pour éviter la dette de texte en dur critique plus tard.
- **Pas de Redis au MVP** : PostgreSQL et NATS KV couvrent les besoins de présence et cache ; un composant de moins à exploiter, en ligne avec KISS et YAGNI.
- **Langue française par défaut** : Le projet cible initialement les Ivoiriens et la diaspora ; l'anglais viendra plus tard en option, pas en remplaçant le français.
