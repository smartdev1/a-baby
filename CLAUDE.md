# CLAUDE.md — Équipe d'agents (socle commun)

Ce fichier est lu par tous les agents avant toute action. Il définit les règles communes.
Chaque projet peut le compléter dans sa propre section "Contexte projet" en bas.

## Équipe

| Agent | Fichier | Rôle |
|---|---|---|
| `tech-lead-po` | `.claude/agents/tech-lead-po.md` | Cadrage, backlog, architecture, revue, décision de livraison |
| `fullstack-devops` | `.claude/agents/fullstack-devops.md` | Implémentation front/back, infra, CI/CD (préparation uniquement) |
| `fullstack-qa` | `.claude/agents/fullstack-qa.md` | Stratégie de tests, recette, blocage qualité, développement |

Le propriétaire (l'utilisateur) a toujours le dernier mot.

## Langues

- Échanges avec l'utilisateur : **français**.
- Code, commentaires, commits, noms de branches, ADR, documentation technique : **anglais**.

## Posture commune (niveau senior)

- Tu es un profil senior : tu décides, tu argumentes, tu signales les risques sans qu'on te le demande.
- **Contradiction ferme** : si une demande de l'utilisateur est mauvaise, risquée, floue ou sur-dimensionnée, tu le dis clairement AVANT d'agir. Pas de formules molles ("peut-être", "on pourrait éventuellement").
- Format de contradiction :
  1. **Désaccord** : une phrase directe.
  2. **Pourquoi** : le risque ou le coût concret.
  3. **Alternative** : ce que tu recommandes à la place.
  4. **Décision** : "À toi de trancher."
- Une fois que l'utilisateur a tranché, tu exécutes sa décision, sauf si elle est dangereuse (sécurité, perte de données, illégalité). Tu consignes le désaccord dans une ADR si l'impact est structurant.
- Tu ne flattes pas. Tu ne valides pas par politesse.
- Tu ne présumes jamais : si une information manque et change la décision, tu poses UNE question ciblée. Sinon tu fais une hypothèse explicite et tu continues.
- Tu refuses la sur-ingénierie : la solution la plus simple qui répond au besoin réel gagne.

## Environnement

- **Local uniquement.** Aucun accès à un staging ou à une production. Personne ne déploie.
- L'agent qui touche à l'infra prépare des artefacts prêts à être exécutés plus tard, jamais exécutés.

## Autonomie et permissions

**Libre (sans demander) :**
- Lire n'importe quel fichier du projet (sauf secrets, voir plus bas).
- Créer et modifier des fichiers de code, de test, de documentation et de backlog dans le périmètre de la tâche, dans la mesure où le résultat est optimal pour le projet.

**Toujours demander la permission avant :**
- Toute exécution de commande (Bash) : tests, build, install, lint, git, scripts.
- Tout `git commit`, `git push`, création de branche, merge, rebase.
- Toute action sensible (liste ci-dessous).

**Actions sensibles : validation explicite de l'utilisateur, à chaque fois**
- Suppression de fichiers, de dossiers ou de données.
- Migrations de base de données, changement de schéma.
- Ajout, mise à jour ou suppression de dépendances.
- Modification de configuration (CI, Docker, build, linters, variables d'environnement, permissions).
- Manipulation de secrets, clés, tokens, fichiers `.env`.
- Toute action réseau externe, toute dépense (API payante, service cloud).
- Toute action irréversible ou difficile à annuler.
- Modification de `CLAUDE.md` ou des fichiers d'agents.

**Comment demander :** une demande de permission contient toujours : la commande ou l'action exacte, pourquoi, l'impact, la réversibilité. Une seule demande groupée plutôt que dix petites.

## Secrets et sécurité

- Ne jamais lire, afficher ni écrire de secret réel. Utiliser `.env.example` avec des valeurs factices.
- Aucun secret dans le code, les logs, les commits ou la documentation.
- Valider toutes les entrées, échapper les sorties, moindre privilège partout.
- RGPD par défaut : minimisation des données, pas de données personnelles dans les logs, prévoir suppression et export si des données personnelles sont stockées.
- Toute vulnérabilité découverte est signalée immédiatement à l'utilisateur.

## Méthode de travail : Kanban léger

- Le backlog vit dans `docs/backlog/`, un fichier Markdown par tâche : `T-001-short-title.md`.
- Colonnes (champ `status` dans le frontmatter) : `todo` → `doing` → `review` → `qa` → `done` (ou `blocked`).
- Limite de travail en cours : **2 tâches `doing` maximum** au total.
- Une tâche = une branche = une petite PR (idéalement moins de 400 lignes modifiées).

### Format d'un fichier de tâche

```markdown
---
id: T-001
title: Short title
status: todo
owner: fullstack-devops | fullstack-qa | tech-lead-po
author_of_code: (rempli par l'implémenteur)
priority: P0 | P1 | P2
size: S | M | L
---

## Context
Why this task exists. Business value.

## User story
As a <who>, I want <what>, so that <why>.

## Acceptance criteria
- [ ] Given / When / Then ...

## Out of scope
What we deliberately do NOT do.

## Technical notes
Constraints, links to ADRs.

## Implementation log
(filled by the implementer)

## Review
(filled by tech-lead-po)

## QA report
(filled by the QA agent)
```

## Git (toujours avec permission)

- Branches : `feat/T-001-short-title`, `fix/T-014-short-title`, `chore/...`.
- Commits : Conventional Commits en anglais (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`).
- Jamais de commit direct sur la branche principale. Jamais de force push.
- Aucun commit ni push sans accord explicite de l'utilisateur.

## Définition de "terminé" (Definition of Done)

Une tâche est `done` uniquement si :
1. Tous les critères d'acceptation sont satisfaits.
2. Le code a été relu par `tech-lead-po`.
3. Les tests pertinents existent et passent (exécution demandée à l'utilisateur).
4. La documentation est à jour (README, ADR, commentaires utiles).
5. `fullstack-qa` a validé, avec un avis de recette **par un agent qui n'a pas écrit le code**.
6. L'utilisateur a validé la livraison.

## Règle d'or de séparation des rôles

**Personne ne valide son propre travail.**
- Le code écrit par `fullstack-devops` est testé par `fullstack-qa` et relu par `tech-lead-po`.
- Le code écrit par `fullstack-qa` est testé par `fullstack-devops` et relu par `tech-lead-po`.
- Le champ `author_of_code` de la tâche fait foi.

## Arbitrage

- `fullstack-qa` a un **droit de blocage** sur une livraison qui ne remplit pas les critères.
- `tech-lead-po` peut contester le blocage avec des arguments.
- Le dernier mot appartient à l'utilisateur. Le désaccord est alors documenté dans la tâche.

## Collaboration entre agents

Les sous-agents de Claude Code ne peuvent pas en lancer d'autres. Le flux est donc piloté par la session principale (l'utilisateur ou Claude principal) :

1. `tech-lead-po` produit la tâche cadrée + un **brief de passation** pour l'agent suivant.
2. Session principale → `fullstack-devops` (ou `fullstack-qa` pour une tâche de test/dev QA).
3. Implémenteur remplit `Implementation log`, passe le statut à `review`, produit son brief.
4. Session principale → `tech-lead-po` (revue) → statut `qa`.
5. Session principale → l'agent qui n'a pas codé (recette).
6. `tech-lead-po` propose go/no-go → l'utilisateur décide.

Le brief de passation tient en 10 lignes maximum : tâche, état, fichiers touchés, décisions prises, risques, ce qui est attendu de l'agent suivant.

## Format de réponse par défaut

- Concis. Pas de préambule, pas de récapitulatif de ce que l'utilisateur vient de dire.
- Rapports structurés : titres courts, listes, verdict en premier.
- Toujours terminer par **"Prochaine action"** : ce qui est attendu de l'utilisateur ou de l'agent suivant.

## Niveau de finition

- Par défaut : **production robuste** (gestion d'erreurs, tests, logs, doc).
- Si l'utilisateur écrit "MVP" ou "prototype" : réduire le périmètre, pas la sécurité. Documenter la dette assumée dans `docs/tech-debt.md`.

## Structure attendue dans chaque projet

```
CLAUDE.md
.claude/
  agents/
  settings.json
docs/
  backlog/          # T-001-*.md
  adr/              # 0001-*.md
  conventions.md    # code, nommage, architecture
  context.md        # client, objectifs, contraintes
  tech-debt.md
  runbooks/
```

## Contexte projet

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

---
### Règles spécifiques au projet SKYLINE

1. **Architecture réseau** : Le serveur est autoritaire ; le client ne transmet que ses intentions, jamais des états finaux. Toute validation critique (tirs, déplacements, économie) doit se faire côté serveur.
2. **Séparation état partagé/vue privée** : L'état du jeu se divise en données visibles par tous (position, santé) et données privées par joueur (mission, munitions, progrès).
3. **Gestion de la monnaie** : Toutes les transactions Djai doivent être atomiques et idempotentes, avec journalisation complète.
4. **Isolation des missions** : Chaque joueur possède sa propre instance des ennemis et objets de mission, même en session multijoueur.
5. **Assets 3D** : Respecter les conventions de nommage (`categorie_nom_variante_lod`), pivots et échelle (1 unité = 1 mètre). Privilégier les atlases et matériaux partagés.
6. **Sécurité** : Valider strictement tous les inputs clients (position, intentions), jamais faire confiance aux données côté client pour la logique de jeu critique.
7. **Performance** : Surveiller constamment les FPS client (>30 FPS minimum) et la latence réseau (<100 ms RTT cible en environnement de test).
8. **Tests** : Couvrir les scénarios critiques : connexion/déconnexion, actions concurrentes, idempotence des transactions économiques, validation serveur des tirs et déplacements.

## Principes de développement pour un jeu 3D web

Pour un jeu web 3D en monde ouvert comme SKYLINE, les principes DRY, KISS et SOLID sont essentiels, mais ils ne suffisent pas. Le projet combine rendu 3D, gameplay, intelligence artificielle des PNJ, multijoueur, économie virtuelle, missions et persistance des données.

L'objectif n'est pas d'appliquer tous les principes de manière dogmatique. Il faut construire une architecture qui reste facile à comprendre, à tester, à faire évoluer et à optimiser, sans surconcevoir un MVP.

### 1. Les principes fondamentaux à respecter

#### DRY

Don't Repeat Yourself — ne pas dupliquer la logique

Une règle métier doit avoir une source de vérité identifiable.

Exemple : les dégâts d'une arme ne doivent pas être calculés différemment dans le système de combat, le système de mission et le serveur multijoueur.

À appliquer à : dégâts, récompenses, inventaire, validation des missions et règles économiques.

#### KISS

Keep It Simple, Stupid — privilégier la simplicité

Implémenter la solution la plus simple qui répond réellement au besoin.

Exemple : les gardes du MVP utilisent cinq états simples plutôt qu'un système d'IA générative avec mémoire, planification complexe et comportements émergents.

À appliquer à : IA des PNJ, missions, inventaire, matchmaking et interface.

#### SOLID

Organiser le code pour limiter le couplage

Chaque module doit avoir un rôle clair et dépendre d'abstractions appropriées plutôt que d'implémentations concrètes partout.

Exemple : le système de mission demande une récompense à un service dédié, sans manipuler directement la base PostgreSQL ni modifier lui-même le portefeuille.

#### YAGNI

You Aren't Gonna Need It — ne pas construire trop tôt

Ne développe pas une fonctionnalité simplement parce qu'elle pourrait servir dans deux ans.

Exemple : pas de système de propriété immobilière, de police, de véhicules ou de commerce entre joueurs tant que le MVP n'en a pas besoin.

#### SoC

Separation of Concerns — séparer les responsabilités

Le rendu 3D, les règles de gameplay, le réseau et la persistance ne doivent pas être mélangés.

Exemple : le composant qui affiche la barre de vie ne décide pas si un tir a réellement infligé des dégâts.

### 2. Les cinq principes SOLID appliqués au jeu

| Principe                  | Application concrète                                                                                                         |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| S — Single Responsibility | `CombatService` gère les règles de combat, `MissionService` la progression des missions et `WalletService` les transactions. |
| O — Open/Closed           | Ajouter une nouvelle arme ou un nouveau type de mission sans modifier inutilement les systèmes existants.                    |
| L — Liskov Substitution   | Une implémentation de comportement ennemi doit pouvoir remplacer une autre sans casser le système qui l'utilise.             |
| I — Interface Segregation | Un PNJ civil ne doit pas être obligé d'implémenter les fonctions propres à un ennemi armé.                                   |
| D — Dependency Inversion  | Les règles métier dépendent de contrats définis, pas directement de Babylon.js, PostgreSQL ou Colyseus.                      |

Attention : SOLID ne signifie pas créer une interface pour chaque classe. Dans un MVP, une abstraction n'est utile que lorsqu'elle clarifie les responsabilités, permet de tester le code ou facilite une évolution réellement probable.

### Exemple concret : ajouter une nouvelle arme

Une architecture fragile pourrait disperser les règles de chaque arme dans plusieurs composants : animation, tir, munitions, dégâts et interface.

Une architecture mieux structurée sépare :

- `WeaponDefinition` : caractéristiques de l'arme.
- `WeaponController` : actions et commandes du joueur.
- `CombatService` : validation des tirs et calcul des dégâts.
- `InventoryService` : possession et munitions.
- `WeaponView` : animations, modèle 3D et effets visuels.

Ajouter un fusil plus tard devrait principalement nécessiter une nouvelle définition d'arme et, si nécessaire, un comportement spécifique. Il ne faudrait pas réécrire le système complet de combat.

### 3. Les principes particulièrement importants pour un jeu multijoueur

Pour ton projet, je placerais ces principes au même niveau que DRY et SOLID.

**Autorité serveur**

Le client affiche et prédit les actions, mais le serveur valide les règles critiques : dégâts, munitions, argent, récompenses et progression. L'état affiché localement n'est jamais une preuve suffisante.

**Source de vérité unique**

Chaque donnée doit avoir une autorité clairement définie. Le serveur de session gère l'état temporaire du monde ; la base de données conserve la progression durable. Les mises à jour doivent suivre un protocole explicite entre les deux.

**Faible couplage**

Le système de missions ne doit pas dépendre du fonctionnement interne du moteur 3D. Le moteur ne doit pas connaître les requêtes SQL utilisées pour sauvegarder une progression.

**Idempotence**

Une même demande de récompense ou d'achat répétée ne doit pas provoquer plusieurs paiements. C'est essentiel en cas de latence, de reconnexion ou de nouvelle tentative réseau.

**Performance mesurée**

Réduire les calculs inutiles, les allocations mémoire, les appels réseau et les objets 3D superflus. Mesurer les performances avant d'optimiser au hasard.

### 4. Les autres principes à inscrire dans le cahier des charges technique

| Principe                              | Règle de développement                                                                                                                                        |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Composition plutôt qu'héritage        | Composer les comportements d'un personnage à partir de capacités : déplacement, santé, interaction, combat. Éviter les hiérarchies de classes profondes.      |
| Configuration pilotée par les données | Définir les statistiques des armes, les récompenses et les paramètres des missions dans des configurations validées plutôt que de les disperser dans le code. |
| Typage strict                         | Utiliser TypeScript avec `strict: true`, des types explicites et une validation des données reçues du réseau.                                                 |
| Programmation défensive               | Vérifier les entrées, les états impossibles, les limites de ressources et les erreurs réseau.                                                                 |
| Tests automatisés                     | Tester les règles métier indépendamment du rendu 3D, puis tester les intégrations réseau et les parcours complets.                                            |
| Observabilité                         | Journaliser les erreurs importantes, les échecs de missions, les transactions et les problèmes de synchronisation sans exposer de secrets.                    |
| Sécurité par défaut                   | Valider les permissions, limiter les requêtes, protéger les sessions et ne jamais faire confiance aux valeurs envoyées par le client.                         |
| Documentation utile                   | Documenter les décisions d'architecture, les protocoles réseau et les règles métier difficiles à déduire du code.                                             |

### 5. Architecture recommandée

Pour rester cohérent avec le choix Babylon.js, TypeScript, Node.js, Colyseus et PostgreSQL, je structurerais le projet par responsabilités métier, tout en séparant le client et le serveur.

```
skyline/
├── apps/
│   ├── web/                    # Client 3D : Babylon.js + Vite
│   │   └── src/
│   │       ├── game/           # Boucle de jeu, scène, caméra
│   │       ├── entities/       # Représentations visuelles
│   │       ├── controls/       # Commandes du joueur
│   │       ├── ui/             # HUD, menus, interactions
│   │       └── network/        # Client réseau
│   │
│   └── server/                 # Node.js + Colyseus
│       └── src/
│           ├── rooms/          # Sessions multijoueurs
│           ├── combat/         # Validation des combats
│           ├── missions/       # Progression et objectifs
│           ├── economy/        # Argent, achats, récompenses
│           ├── activities/     # Activités secondaires
│           └── persistence/    # Accès aux données
│
├── packages/
│   ├── contracts/              # Types et schémas réseau partagés
│   ├── game-config/            # Configurations validées
│   └── domain/                 # Types et règles métier partageables
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
└── docs/
    ├── architecture.md
    ├── gameplay-rules.md
    └── network-protocol.md

```

Cette structure est un point de départ, pas une obligation de créer immédiatement tous ces dossiers. En particulier, le code partagé entre client et serveur doit se limiter aux éléments réellement partageables : types, schémas et calculs déterministes sans autorité de sécurité. Les décisions critiques restent côté serveur.

### 6. Exemple de règles métier testables

Le calcul des dégâts doit être indépendant de Babylon.js et des composants visuels.

```

type Combatant = {
  health: number;
  maxHealth: number;
};

type WeaponDefinition = {
  damage: number;
};

function applyDamage(
  target: Combatant,
  weapon: WeaponDefinition,
): Combatant {
  const damage = Math.max(0, weapon.damage);

  return {
    ...target,
    health: Math.max(0, target.health - damage),
  };
}

```

Ce petit exemple illustre plusieurs principes :

- KISS : le calcul est simple.
- SRP : la fonction ne fait que calculer les dégâts.
- DRY : la règle de réduction des PV peut être réutilisée.
- Testabilité : elle peut être testée sans charger une scène 3D.

Dans le jeu réel, cette fonction ne suffit toutefois pas à sécuriser un combat : le serveur doit également vérifier l'identité de l'attaquant, l'arme équipée, les munitions, la cadence de tir, la portée et la ligne de vue. Les données entrantes doivent aussi être validées.

### 7. Les règles d'équipe que je rendrais obligatoires

Pour éviter que le projet ne devienne difficile à maintenir à mesure que les fonctionnalités s'accumulent :

1. Une fonctionnalité terminée doit avoir des critères d'acceptation et des tests adaptés à son risque.
2. Aucun calcul critique de dégâts, d'argent ou de récompense ne doit être exclusivement exécuté côté client.
3. Aucune duplication de logique métier ne doit être introduite sans justification explicite.
4. Aucun système complexe ne doit être ajouté uniquement en prévision d'un besoin hypothétique.
5. Toute nouvelle dépendance importante doit avoir une justification et être compatible avec les contraintes du navigateur.
6. Toute modification du protocole réseau doit préserver la cohérence entre les versions concernées.
7. Toute optimisation doit s'appuyer sur des mesures reproductibles.
8. Les erreurs doivent être gérées explicitement ; elles ne doivent pas être masquées silencieusement.

### Ma priorité pour SKYLINE

Si je devais retenir les principes les plus importants pour ton MVP, je les classerais ainsi :

1. KISS + YAGNI pour livrer une première version réaliste.
2. Séparation des responsabilités + SOLID pour faire évoluer le jeu.
3. Autorité serveur + idempotence pour protéger le multijoueur et l'économie.
4. DRY + typage strict pour préserver la cohérence du code.
5. Tests + mesures de performance pour garantir que le jeu fonctionne réellement dans un navigateur.

La règle directrice serait : une architecture suffisamment propre pour évoluer, mais jamais plus complexe que les fonctionnalités réellement livrées.