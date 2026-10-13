# Spike SP4 — Latence depuis Abidjan

> Tâche T-019 · Kit prêt le 13/10/2026 · **Mesures à réaliser par le propriétaire** (testeurs à Abidjan, instances temporaires).

## Objectif

Choisir la région d'hébergement des serveurs de jeu sur des mesures réelles : RTT p50 et p95, gigue et perte, mesurés par opérateur (Orange, MTN, Moov, fixe), par type d'accès et par créneau horaire. La cible du jeu est **un RTT p95 inférieur ou égal à 150 ms**, la latence que la prédiction côté client sait absorber (spike SP6).

## Régions candidates (à déployer temporairement, coût et disponibilité à vérifier)

| Id | Région | Pourquoi la tester |
|---|---|---|
| `eu-west-mrs` | Marseille (France) | Arrivée de nombreux câbles sous-marins africains |
| `eu-west-par` | Paris (France) | Grande offre d'hébergeurs à trafic inclus |
| `eu-south-lis` | Lisbonne (Portugal) | Arrivée de câbles récents vers l'Afrique de l'Ouest |
| `af-west-lag` | Lagos (Nigeria) | Proximité géographique |
| `af-west-abj` | Abidjan (centre de données local) | Aucun transfert de données hors de Côte d'Ivoire (voir § ARTCI) |
| `af-south-jnb` | Johannesburg (Afrique du Sud) | Grandes régions cloud africaines, à titre de comparaison |

Trois ou quatre régions suffisent. **Aucune dépense ni aucun déploiement n'est fait par un agent.**

## Protocole

1. **Déployer** l'image `infra/docker/latency-echo` (voir son README) dans chaque région retenue, derrière TLS, avec la même variable `PROBE_REGIONS` partout. Elle contient la liste des URL `wss://…/echo`.
2. **Testeurs** : au moins 2 par opérateur (Orange, MTN, Moov) en 4G, plus 2 en accès fixe ou box. Ils ouvrent la page de n'importe quelle instance.
3. **Créneaux** : matin (7 h – 10 h), midi (12 h – 14 h) et soir (19 h – 23 h, l'heure de pointe du jeu), sur au moins 2 jours, dont un jour de semaine.
4. Chaque mesure envoie 300 pings par région (environ 1 minute), puis le testeur clique sur **Télécharger** et envoie le fichier JSON.
5. **Agrégation** : `node tools/latency-probe/src/aggregate-results.mjs <dossier>`, puis copie du tableau ci-dessous.
6. **Détruire** les instances temporaires.

## Résultats

*À compléter : coller la sortie de l'agrégateur.*

| Opérateur | Accès | Créneau | Région | Mesures | p50 (ms) | p95 (ms) | Gigue (ms) | Perte (%) |
|---|---|---|---|---:|---:|---:|---:|---:|
| — | — | — | — | — | — | — | — | — |

## Règle de décision proposée

1. Écarter toute région dont le **p95 au créneau du soir dépasse 150 ms** pour l'un des trois opérateurs mobiles.
2. Parmi les régions restantes, choisir le **p95 du soir le plus bas, pondéré par la part de marché des opérateurs**.
3. À latence équivalente (moins de 15 ms d'écart), préférer un hébergement **en Côte d'Ivoire** pour éviter le transfert de données, puis l'offre au trafic inclus le moins cher (ARCHITECTURE §6.4).

## Implications ARTCI (loi n° 2013-450 relative à la protection des données à caractère personnel)

- Héberger les serveurs **hors de Côte d'Ivoire** fait transiter et stocker hors du pays les données des joueurs : identifiant d'appareil, adresse IP, chat, progression. C'est un **transfert vers un pays tiers**, que la loi encadre : le pays doit offrir une protection suffisante, et une formalité préalable auprès de l'ARTCI est nécessaire.
- **Héberger en Côte d'Ivoire** supprime cette question du transfert, mais laisse les autres obligations (déclaration du traitement, sécurité, durée de conservation).
- Dans tous les cas : minimiser les données, ne conserver les adresses IP que 30 jours au plus, documenter le registre des traitements (ARCHITECTURE §20.3).
- **À faire valider par un juriste avant la bêta publique** (question ouverte Q8). Ce paragraphe n'est pas un avis juridique.

## Recommandation

*En attente des mesures.* Les distances physiques ne prédisent pas le routage réel en Afrique de l'Ouest, d'où ce spike.
