---
id: T-021
title: i18n foundation: @skyline/i18n, fr-CI catalogues, no hard-coded text rule
status: todo
owner: fullstack-devops
author_of_code:
priority: P0
size: S
---

## Context
Le propriétaire exige l'i18n dès le départ : français (locale `fr-CI`) avec du nouchi dans les dialogues de PNJ, et aucun texte en dur.

Jalon : **J0 — Assainissement & fondations** (`docs/roadmap.md`). Dépend de : T-004.

## User story
En tant que joueur, je veux des textes cohérents en français ; en tant qu'équipe, je veux pouvoir ajouter une langue ou un registre sans toucher au code.

## Acceptance criteria
- [ ] Given `@skyline/i18n` (pur), Then il fournit la résolution de clés `domaine.sous_domaine.cle`, l'interpolation, les pluriels, le formatage des nombres et des montants en Djai, et le registre (`standard` | `nouchi`) avec repli sur `standard`.
- [ ] Given `content/i18n/fr-CI/<domaine>.json`, Then les premiers catalogues existent (`legal`, `debug`, `loading`), un fichier par domaine.
- [ ] Given une clé manquante, Then le client affiche la clé et logue un avertissement en développement ; un test de validation échoue en CI.
- [ ] Given `apps/web/src/ui/`, Then une règle de lint interdit les chaînes littérales affichées (ex. `i18next/no-literal-string` ou une règle locale équivalente), avec des exceptions documentées.
- [ ] Given le paquet, Then la couverture de lignes est ≥ 85 %.

## Out of scope
- Rédaction des dialogues en nouchi (J3).
- Autres langues.

## Technical notes
Ajout éventuel d'un plugin ESLint : accord du propriétaire requis. Réf. ARCHITECTURE §2.1 (Langues), §27, §28 règle 14.

Toute exécution de commande (install, build, test, git) doit être demandée au propriétaire (CLAUDE.md). Règles de modularité : ARCHITECTURE.md §9.

## Implementation log
(filled by the implementer)

## Review
(filled by tech-lead-po)

## QA report
(filled by the QA agent)
