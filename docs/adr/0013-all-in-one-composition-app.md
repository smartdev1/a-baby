# ADR 0013 — `apps/all-in-one`, application de composition

- **Statut** : Acceptée (propriétaire, 13/10/2026)
- **Contexte** : le mode `all-in-one` (ARCHITECTURE §6.3) fait tourner passerelle, zone et services dans un seul processus Node (développement, tests, J1–J4). La règle de frontières interdit qu'une app en importe une autre (§9.3), donc aucune app existante ne pouvait composer les trois sans enfreindre la règle.

## Décision

1. Une app dédiée, `apps/all-in-one`, est la **racine de composition** du mode tout-en-un. Elle ne contient **que de la composition** (configuration, câblage, démarrage, arrêt) et un test de bout en bout.
2. Elle est la **seule** app autorisée à importer d'autres apps, et **uniquement leur API publique** `src/index.ts` (`gateway`, `zone`, `services` ; jamais `web`).
3. Les autres apps continuent de ne jamais s'importer entre elles.
4. Vérifié par dependency-cruiser (`apps-do-not-import-apps` avec exception, `all-in-one-uses-public-app-entries-only`).
5. Périmètre : développeur backend (`.claude/ownership.json`).

## Conséquences

- Les apps `gateway`, `zone`, `services` exposent une API publique (`exports` → `src/index.ts`) en plus de leur `main.ts` autonome.
- Le passage en mode `distributed` (J5) n'utilise pas `all-in-one` : chaque processus démarre par son propre `main.ts`, reliés par NATS. Aucun code métier ne change (§6.3).
