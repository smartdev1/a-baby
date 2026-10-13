# Spike SP3 — Plusieurs processus de zone, NATS et transfert entre cellules

> Tâche T-110 · Mesures du 13/10/2026 · Poste de développement (Intel i9-10885H, 8 cœurs / 16 fils, 32 Go), tous les processus sur la même machine.

## Verdict

**L'architecture passerelle + cellules + NATS (ADR 0003) tient. Le transfert entre cellules est validé.** Avec 500 bots qui franchissent ensemble la frontière entre deux processus de zone :

| Critère | Cible | Mesuré |
|---|---|---|
| Transferts réussis | 100 % | **500 / 500** |
| Durée du transfert côté serveur (publication → adoption, p95) | < 100 ms | **5 ms** |
| Interruption vue par le client (écart entre deux acquittements autour du transfert, p95) | < 100 ms | **94,5 ms** (50 ms en régime normal) |
| Saut de position après transfert (max., une fois le déplacement attendu retiré) | invisible | **0,45 m** (corrigé par la réconciliation client) |
| Tick serveur p95 avec 500 joueurs dans une cellule | < 50 ms (budget de 20 Hz) | **6,5 à 9 ms** |
| Débit descendant par joueur | — | **≈ 730 kbit/s** ⚠ |

Le seul point rouge est **la bande passante**. Elle croît en O(N²), parce que chaque joueur reçoit les 500 entités de la cellule à 10 Hz. Cette limite est connue : la gestion d'intérêt (J5) la résoudra. Ce n'est pas un défaut du transfert.

## Montage

```
bots (500) ──ws──▶ passerelle ──NATS──▶ zone A (C_81_49) ──handoff──▶ zone B (C_82_49)
                     │                      ▲                          │
                     └──HTTP (tickets)──▶ services ◀──HTTP (horloge)───┘
```

- **NATS** : `nats:2.11-alpine` (v2.11.17), figé par digest dans `infra/compose/nats.compose.yml` ; un seul serveur, sans persistance.
- **Zone A** possède `C_81_49`, **zone B** possède `C_82_49` ; la frontière est à E = 382 000 m. Point d'apparition : (381 940, 589 300), soit 60 m à l'ouest de la frontière, sur une ligne dégagée de bâtiments et d'eau.
- Les bots demandent un ticket, se connectent, puis courent plein est (6 m/s) à 20 Hz avec un ping par seconde. Leur démarrage est étalé sur 1 s. Ils franchissent donc tous la frontière entre 10 et 12 s après leur arrivée.
- Commandes : voir `infra/compose/README.md`. Pour les bots : `--walk east`, plus `--stats` sur les deux zones.

## Protocole de transfert

1. Après la simulation d'un joueur, la zone A constate qu'il est sorti de sa cellule. Elle publie `cell.C_82_49.handoff`, avec la position UTM absolue, la vitesse, l'état au sol, la dernière séquence d'entrée et le cap. Elle retire ensuite le joueur.
2. La zone B adopte le joueur dans son propre repère. Il garde le même identifiant d'entité, qui est un hash FNV-1a de la session : il est unique sans coordination. La zone B envoie `welcome`, avec le nouveau `cellKey` et le nouveau `frameOrigin`, puis `worldClock`.
3. À la réception de ce `welcome`, la passerelle redirige les entrées vers B et suit les snapshots de B.
4. Pendant 2 s, A relaie vers B les entrées qui lui arrivent encore, celles émises avant la bascule de la passerelle. Aucune entrée n'est perdue.
5. Vers une cellule qu'aucune zone ne possède, le déplacement est annulé : c'est le bord du monde.

## Ce que le spike a révélé (et corrigé)

| Problème au premier essai à 500 bots | Cause | Correction |
|---|---|---|
| Tick p95 de 77 à 106 ms, transferts retardés de 3 à 4 s | Snapshot de 500 entités publié une fois **par joueur** sur NATS, puis décodé et réencodé par session : O(N²) à travers le bus | La zone publie **un** snapshot par cellule (`cell.<clé>.snapshot`). La passerelle s'y abonne une fois par cellule, l'encode une fois et envoie la même trame à toutes ses sessions (`routing/cell-fanout.ts`). |
| Joueurs fantômes possibles après une déconnexion pendant un transfert | Départ envoyé à l'ancienne cellule | Sujet global `session.closed`, écouté par toutes les cellules |
| Écart d'acquittement p95 de 111 ms, saut de 0,68 m | Entrées envoyées à A pendant la bascule, donc perdues | Relais des entrées pendant 2 s (`handoff/input-forwarding.ts`) |

## Mesures détaillées

### 500 bots, marche vers l'est (transferts)

| Mesure | Valeur |
|---|---|
| Connectés / accueillis | 500 / 500, aucune erreur |
| Acquittements par bot et par seconde | 20,0 |
| RTT ping p50 / p95 (local) | 10,9 / 43,2 ms |
| Transferts vus par les bots | 500 |
| Écart d'acquittement au transfert p50 / p95 | 78,2 / 94,5 ms |
| Saut de position max. | 0,45 m |
| Zone A : tick p95 / max. | 6,5 / 10,1 ms |
| Zone B : tick p95 / max. | 9,0 / 14,8 ms |
| Durée du transfert (B, p95) | 5 ms |
| Joueurs restants après déconnexion | 0 et 0 |

### 500 bots, marche aléatoire (une seule cellule, sans transfert)

| Mesure | Valeur |
|---|---|
| Tick p50 / p95 / max. (500 joueurs dans C_81_49) | 5,0 / 8,0 / 17,4 ms |
| RTT p50 / p95 | 9,8 / 25,2 ms |
| Débit descendant par bot | 741 kbit/s |
| CPU moyen (à mi-parcours) | passerelle ≈ 59 % d'un cœur, zone A ≈ 31 %, NATS ≈ 55 %, services ≈ 5 % |

La simulation physique n'est pas le facteur limitant. Une cellule à 500 joueurs consomme moins de 20 % de son budget de tick.

## Bande passante par joueur

- **Montant** : environ 10 octets d'entrée × 20 Hz, plus le cadrage WebSocket, soit **≈ 3 à 4 kbit/s**.
- **Descendant** : un acquittement à 20 Hz (≈ 60 o), plus un snapshot à 10 Hz. Le snapshot pèse **≈ 18 o par entité** visible.
  - Avec 500 entités : ≈ 9 Ko par snapshot, soit ≈ 730 kbit/s ;
  - avec 64 entités visibles (cible de la gestion d'intérêt) : **≈ 100 kbit/s** ;
  - avec 32 entités : ≈ 55 kbit/s.

La cible mobile, en 4G à Abidjan, impose de limiter chaque client aux entités proches. C'est l'objet de la gestion d'intérêt en J5 : rayon, priorités, fréquence réduite à distance, et quantification des positions et des caps. **Sans elle, le monde sans limite de joueurs n'est pas tenable en bande passante, même si le CPU l'est.**

## Risques et suites

1. **Gestion d'intérêt (J5, priorité haute)** : c'est indispensable avant tout test public à plus de 50 joueurs dans une zone.
2. **Fantômes aux frontières (J5)** : un joueur ne voit pas encore ceux de la cellule voisine à moins de 50 m de la frontière. Il faut des abonnements aux snapshots des cellules voisines, côté passerelle (le code de `CellFanout` le permet).
3. **Horloges** : la durée du transfert est mesurée avec `Date.now()` de deux processus sur la même machine. Sur plusieurs machines, il faudra la mesurer côté client, avec l'écart d'acquittement, comme ici.
4. **NATS unique, sans persistance** : un redémarrage de NATS coupe les sessions. La production demandera un cluster de 3 nœuds (hors périmètre, ADR 0003).
5. **Charge du bus** : NATS consomme environ 55 % d'un cœur, surtout pour les acquittements, soit 500 × 20 messages JSON par seconde. Pistes, à mesurer d'abord : acquittements en binaire (msgpack) sur le bus, regroupement des acquittements par passerelle.
6. **Passerelle** : environ 59 % d'un cœur pour 500 sockets. Il faut l'échelonner horizontalement : plusieurs passerelles, chacune abonnée seulement aux cellules de ses joueurs.
