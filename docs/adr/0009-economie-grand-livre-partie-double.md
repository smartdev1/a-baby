# ADR 0009 — Économie Djai en grand livre à partie double, atomique et idempotente

- **Statut** : Proposée
- **Date** : 13/10/2026

## Contexte

Le MVP comporte achats, salaires, transport, loyers, **achat de logements**, **commerces de joueurs** (stock, prix, caisse) et **emplois entre joueurs**. Le schéma Prisma existant a une double source de vérité du solde (`Character.djaiBalance` et `Wallet.balance`) et il est invalide (cartographie, M4). CLAUDE.md impose des transactions atomiques, idempotentes et journalisées.

## Décision

1. **Grand livre en partie double** : `ledger_account` (personnage, commerce = caisse, séquestre, système), `ledger_transaction` (clé d'idempotence **unique**), `ledger_entry`. La somme des jambes de chaque transaction est nulle. Montants entiers en `bigint`.
2. **Solde dénormalisé** dans `ledger_account`, mis à jour dans la même transaction, avec `CHECK (balance >= 0)` pour les personnages et les caisses.
3. **Contrat unique** `EconomyPort.commit({ idempotencyKey, kind, legs, stockOps?, reason })` : un rejeu renvoie le résultat d'origine. Clés dérivées de l'intention (`action:{requestId}`, `rent:{leaseId}:{gameWeek}`, `fare:{rideId}`, `escrow_hold:{shiftId}`…).
4. **Opérations de stock, titres de propriété et baux** écrits dans la **même transaction PostgreSQL** que l'argent (module `economy` appelé en interne par `property` et `business`).
5. Verrous de ligne pris **dans l'ordre des identifiants** pour éviter les interblocages ; SQL paramétré explicite pour ces écritures.
6. **Séquestre des salaires** entre joueurs : retenu sur la caisse au début du service, versé à la fin du service validé, remboursé en cas d'abandon.
7. **Plafonds** (salaires, transferts, retraits de caisse), **prix bornés** par article, détection des boucles d'argent ; tableau de bord de la masse monétaire, des sources et des puits.

## Alternatives écartées

| Option                                        | Raison du rejet                                                |
| --------------------------------------------- | -------------------------------------------------------------- |
| Un simple champ `balance` modifié directement | Pas d'audit, rejeux et doubles dépenses difficiles à empêcher  |
| Event sourcing complet                        | Surdimensionné ; le grand livre est déjà un journal            |
| Économie gérée en mémoire par les zones       | Perte d'argent au plantage ; pas de transactions multi-entités |

## Conséquences

- Tout chemin d'argent passe par un seul module, testé par des tests de propriétés et de concurrence (même clé ×100 → une écriture).
- La suppression d'un profil (RGPD) anonymise ses comptes sans casser l'intégrité du grand livre.
- Les commerces et emplois entre joueurs ajoutent environ 6 à 8 semaines au jalon J6 (ARCHITECTURE §3.8).
