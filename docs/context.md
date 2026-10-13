# Contexte du projet

- **Projet** : SkyLine, jeu web 3D de vie virtuelle en monde ouvert, à la 3e personne (ADR 0001, remplace le CDC v1.1 archivé).
- **Monde** : toute la commune de Yopougon (Abidjan), relation OSM `r3377881`, 149,8 km², à l'échelle réelle 1:1, générée depuis OpenStreetMap (ODbL) et extensible aux autres communes. Pas de quartier pilote.
- **Joueurs** : monde unique persistant, sans plafond global (plafond de densité locale), connexion invité, chat texte de proximité.
- **Gameplay MVP** : vie quotidienne (travailler, manger au maquis, se déplacer en gbaka / woro-woro / taxi / bus, louer et acheter un logement, ouvrir un commerce), monnaie fictive Djai, horloge interne du monde. Combat, missions et police en v2.
- **Équipe** : le propriétaire + 2 développeurs (frontend, backend), tout est produit en interne (y compris les assets 3D). Pas d'échéance fixe ; budget d'hébergement décidé à la mise en production.
- **Plateforme** : navigateur sur PC d'abord, architecture prête pour le mobile ; rendu semi-réaliste.
- **Contraintes** : serveur autoritaire, économie idempotente, RGPD et loi ivoirienne 2013-450, ODbL, marques parodiées (ADR 0010), ≥ 30 FPS sur PC modeste.
- **Références** : `ARCHITECTURE.md`, `docs/roadmap.md`, `docs/adr/`, `docs/rules/`, `docs/spikes/`.
