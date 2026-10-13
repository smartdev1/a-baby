# ADR 0011 — Horloge interne du monde, autoritaire et partagée

- **Statut** : Acceptée (propriétaire, 13/10/2026). Ratio par défaut (Q13) et règle hors ligne (Q14) à valider
- **Remplace** : une décision antérieure de caler le monde sur l'heure réelle d'Abidjan

## Contexte

Le jeu a besoin d'un temps commun à tous : cycle jour/nuit, horaires d'ouverture et de travail, fréquences de transport, besoins, échéances de loyers, salaires. Le propriétaire a choisi une **horloge interne** sans lien avec le temps universel, avec un ratio configurable. Le monde est réparti sur plusieurs serveurs de zone, qui doivent partager exactement la même heure.

## Décision

1. **Le temps de jeu est une fonction pure du temps serveur**, définie par un **segment d'horloge** `{segmentId, realEpochMs, gameEpochMin, ratio}` :
   `gameMinute = gameEpochMin + (nowRealMs − realEpochMs) / 60000 × ratio`.
2. **Ratio** dans `content/game-config/clock.json` : par défaut **12** (1 jour de jeu = 2 h réelles). `ratio = 0` met le monde en pause (maintenance).
3. **Autorité** : le module `world-clock` de `apps/services` crée les segments (append-only en base, `world_clock_segment`) et les publie dans NATS KV `world.clock`. Un changement de ratio ou une pause ouvre un **nouveau segment** qui démarre à la minute de jeu courante : le temps est **continu et monotone**.
4. **Toutes les zones partagent la même horloge** : elles lisent le même segment et calculent `gameMinute` à partir de leur horloge système synchronisée par **NTP** (dérive < 50 ms exigée, mesurée et alertée). En mode `all-in-one`, la même fonction tourne en mémoire.
5. **Clients** : ils reçoivent `world_clock{segment, serverTimeMs}` à la connexion, toutes les 30 s et à chaque changement de segment. Ils estiment leur décalage avec le serveur à la manière de NTP (médiane de 8 échanges `ping`/`pong`), **lissent** les corrections (≤ 1 % de vitesse) et ne recalent franchement qu'au-delà de 5 minutes de jeu d'écart. Le client n'utilise jamais son horloge locale pour une règle.
6. **Calendrier de jeu** (`content/game-config/calendar.json`) : 24 h par jour, 7 jours par semaine, 4 semaines par mois, 12 mois par an. `@skyline/sim-clock` fournit conversions, fenêtres horaires et échéances.
7. **Tout s'exprime en temps de jeu** : jour/nuit, horaires, créneaux de travail, transports, besoins, durées et recharges d'actions, loyers, salaires des PNJ gérants, plafonds « par jour de jeu ». Les actions longues utilisent l'**ellipse** : durée en minutes de jeu, plafond en secondes réelles.
8. **Règle hors ligne proposée** (Q14) : besoins **gelés** ; loyers qui **courent en temps de jeu**, prélevés sur l'avance puis sur le solde, avec une fin de bail seulement après **7 jours réels** de préavis et 2 échéances impayées ; biens achetés jamais perdus ; salaires seulement pour un service **effectivement travaillé** ; PNJ gérant payé par heure de jeu d'ouverture, avec fermeture automatique du commerce quand la caisse ne suffit plus. Les échéances sont exécutées par les services de façon idempotente et rattrapées au redémarrage.

## Alternatives écartées

| Option | Raison du rejet |
|---|---|
| Heure réelle d'Abidjan (décision antérieure) | Les joueurs du soir ne voient jamais le jour ; horaires réels trop restrictifs (abandonnée par le propriétaire) |
| Horloge propre à chaque zone, synchronisée par messages | Dérives et divergences entre zones ; un état de plus à répliquer |
| Horloge « tick-based » (compteur de ticks partagé) | Dépend de la régularité des ticks et de la propagation ; la fonction pure du temps serveur est plus simple et plus robuste |
| Besoins et loyers qui courent tous hors ligne | Punit l'absence ; incompatible avec un facteur 12 (une semaine de jeu = 14 h) |

## Conséquences

- Aucune réplication continue de l'heure : un segment suffit, ce qui ne coûte presque rien en bande passante.
- L'exploitation doit garantir NTP sur toutes les machines (runbook, métrique, alerte).
- L'équilibrage (besoins, loyers, salaires) dépend du ratio : il est piloté par la configuration, sans code.
- Les tests utilisent un segment injecté (horloge contrôlée) : aucune règle n'appelle `Date.now()` directement.
