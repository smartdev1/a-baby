# ADR 0003 — Architecture MMO : passerelle WebSocket, serveurs de cellules, bus NATS ; abandon de Colyseus

- **Statut** : Proposée (changement de stack structurant, à valider par le propriétaire, Q2)
- **Date** : 13/10/2026

## Contexte

La vision exige un monde **unique et persistant, sans limite de joueurs imposée par l'architecture**. La stack initiale prévoyait Colyseus (salles de 8 joueurs avec matchmaking). Le serveur existant est un squelette sans salle (cartographie, C5).

## Décision

1. **Passerelle** (`apps/gateway`, ×N, sans état de jeu) : termine une **unique** WebSocket binaire par client ; vérifie le ticket de session ; décode, valide et limite le débit ; route vers la cellule propriétaire ; renvoie les instantanés.
2. **Serveurs de zone** (`apps/zone`, ×N) : chacun héberge une ou plusieurs **cellules** (1 km² par défaut) et en est l'autorité, avec un tick à 20 Hz.
3. **Aire d'intérêt** par hachage spatial : rayon de 150 à 250 m, **plafond** de 64 entités à plein débit et 128 à débit réduit, priorités.
4. **Fantômes** : les entités situées à moins de 200 m d'une frontière sont publiées en lecture seule aux cellules voisines. **Transfert** d'entité avec hystérésis de 20 m, transparent pour le client (sa socket ne change pas).
5. **NATS** (+ JetStream KV pour l'annuaire des cellules à baux et le segment d'horloge du monde) relie passerelles, zones et services. Bus derrière une interface `MessageBus`, avec une implémentation en mémoire pour le mode `all-in-one`.
6. **Démarrage sur une seule machine** : mode `all-in-one` (un processus, bus en mémoire) jusqu'à J4 et pour le palier d'hébergement P0/P1 ; mode `distributed` à partir de J5, **sans modifier le code métier**.
7. **Pas de Redis** au MVP. **Colyseus est retiré.**

## Alternatives écartées

| Option | Raison du rejet |
|---|---|
| **Colyseus** (salle = cellule) | Pensé pour des salles avec matchmaking ; changer de cellule imposerait une reconnexion WebSocket ou plusieurs sockets par client ; l'aire d'intérêt entre salles n'est pas native ; le matchmaking est inutile dans un monde unique. Réévaluable en v2 pour des mini-jeux à salle fermée |
| SpacetimeDB | Modèle intéressant (utilisé par des MMO), mais modules serveur hors de notre écosystème TypeScript, licence et maturité à risque pour une équipe de 3 |
| Nakama | Même modèle de « matchs » que Colyseus ; runtime Go ou Lua |
| Un seul serveur monolithique | Ne passe pas l'échelle ; aucun chemin vers « sans limite » |
| Redis pub/sub | Pas de requête/réponse native ; NATS couvre pub/sub, requête/réponse et KV |

## Conséquences

- Le protocole binaire, la reconnexion et la réplication delta sont à écrire nous-mêmes (≈ 4 à 6 semaines de plus qu'avec Colyseus), compensées par l'absence de contournements.
- « Sans limite » signifie **sans plafond global**. La densité locale est plafonnée (ARCHITECTURE §3.1) ; les couches de cellules saturées sont un point d'extension.
- Le spike SP3 (2 zones, NATS, 500 bots) doit valider le protocole de transfert avant J5.
- Critères J5 : 1 000 bots répartis et 150 dans une même cellule, tick p95 ≤ 25 ms, transfert p95 ≤ 100 ms.
