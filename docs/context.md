# Contexte du projet

- **Projet** : SkyLine, jeu web 3D de vie virtuelle en monde ouvert, à la 3e personne (ADR 0001, remplace le CDC v1.1 archivé).
- **Objectif** : Offrir une simulation de vie authentique dans la commune entière de Yopougon (Abidjan) à l'échelle réelle 1:1, issue d'OpenStreetMap (ODbL), où les joueurs vivent une vie quotidienne : travail, alimentation, logement, commerces, mobilité, interactions sociales. Le monde est persistant, unique et extensible aux autres communes sans réécriture de code.
- **Monde** : toute la commune de Yopougon (Abidjan), relation OSM `r3377881`, 149,8 km², à l'échelle réelle 1:1, générée depuis OpenStreetMap (ODbL) et extensible aux autres communes. Pas de quartier pilote.
- **Joueurs** : monde unique persistant, sans plafond global (plafond de densité locale), connexion invité, chat texte de proximité.
- **Gameplay MVP** : vie quotidienne (travailler, manger au maquis, se déplacer en gbaka / woro-woro / taxi / bus, louer et acheter un logement, ouvrir un commerce), monnaie fictive Djai, horloge interne du monde. Combat, missions et police en v2.
- **Équipe** : le propriétaire + 2 développeurs (frontend, backend), tout est produit en interne (y compris les assets 3D). Pas d'échéance fixe ; budget d'hébergement décidé à la mise en production.
- **Plateforme** : navigateur sur PC d'abord, architecture prête pour le mobile ; rendu semi-réaliste.
- **Contraintes** :
  - Serveur autoritaire, économie idempotente
  - RGPD et loi ivoirienne 2013-450
  - ODbL, marques parodiées (ADR 0010)
  - ≥ 30 FPS sur PC modeste
  - Français (locale `fr-CI`) avec du nouchi dans les dialogues de PNJ, i18n dès le départ : aucun texte en dur
- **Références** : `ARCHITECTURE.md`, `docs/roadmap.md`, `docs/adr/`, `docs/rules/`, `docs/spikes/`.

## Horloge interne du monde (ADR 0011)

Le temps de jeu est une **fonction pure** du temps serveur, définie par un **segment d'horloge** :

- `segmentId` : incrémenté à chaque changement de ratio ou à chaque pause
- `realEpochMs` : instant réel (horloge serveur NTP) de début du segment
- `gameEpochMin` : minute de jeu absolue au début du segment
- `ratio` : minutes de jeu par minute réelle ; 12 par défaut ; 0 = monde en pause (maintenance)

`gameMinute(nowRealMs) = gameEpochMin + (nowRealMs - realEpochMs) / 60000 * ratio`

- **Autorité** : le service `world-clock` (module de `apps/services`) est la **seule** source des segments. Il les persiste en base (`world_clock_segment`) et les publie dans NATS KV `world.clock`. Changer le ratio ou mettre le monde en pause crée un **nouveau segment** qui démarre à la minute de jeu courante : le temps de jeu reste **continu et monotone**, sans saut.
- **Même horloge pour tous les serveurs de zone** : chaque zone lit le segment courant (abonnement KV) et calcule `gameMinute` à partir de son horloge système **synchronisée par NTP** (exigence d'exploitation : dérive < 50 ms, vérifiée par une métrique et une alerte). Deux zones calculent donc la même heure de jeu à quelques dixièmes de minute de jeu près.
- **Diffusion aux clients** : à la connexion, puis toutes les 30 s, la passerelle envoie `world_clock{segment, serverTimeMs}`. Le client estime son **décalage avec l'horloge serveur** et calcule localement `gameMinute`. Il **lisse** les corrections (au plus 1 % d'accélération ou de ralentissement) pour éviter les sauts du soleil, et applique une correction franche au-delà de 5 minutes de jeu d'écart. Le client n'utilise **jamais** son heure locale pour une règle : l'heure affichée et le cycle jour/nuit sont cosmétiques, le serveur décide.
- **Calendrier** (`content/game-config/calendar.json`) : 24 h par jour, **7 jours par semaine** (lundi → dimanche, noms localisés), **4 semaines par mois** (28 jours), **12 mois par an** ; jour 0 = lundi 1er janvier an 1. Avec le facteur 12 : 1 jour de jeu = 2 h réelles, 1 semaine = 14 h, 1 mois = 2,3 jours réels environ.
- **Temps de jeu exprimé** : cycle jour/nuit et éclairage ; horaires d'ouverture des lieux ; créneaux de travail ; fréquences des transports ; décroissance des besoins ; durées et temps de recharge des actions ; échéances des loyers ; salaires des PNJ gérants ; plafonds économiques « par jour de jeu ».
- **Ellipse des actions longues** : une durée d'action est exprimée en minutes de jeu (`duration.gameMinutes`) avec un **plafond réel** (`duration.real.maxSeconds`). Dormir 8 h de jeu (40 min réelles au facteur 12) est compressé à environ 3 min réelles : les effets de la durée de jeu complète s'appliquent, le personnage est « occupé » pendant le temps réel plafonné, et le monde continue à son rythme.
