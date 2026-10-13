# ADR 0012 — Profil invité uniquement au MVP, compte permanent en point d'extension

- **Statut** : Acceptée (propriétaire, 13/10/2026)

## Contexte

Le propriétaire veut une connexion **sans inscription** au MVP (identifiant d'appareil ou jeton). Pourtant, les joueurs peuvent posséder des biens durables (logement acheté, commerce, employés) : perdre le profil a donc un coût élevé.

## Décision

1. `POST /api/v1/auth/guest` crée le profil et renvoie un **jeton d'appareil** (≥ 128 bits, stocké **haché** côté serveur, conservé dans le navigateur).
2. Ce jeton est aussi présenté comme **code de récupération** (affiché à la création et dans les paramètres, copiable). Il permet de restaurer le profil sur un autre navigateur (`POST /auth/guest/session`, limité en débit, verrouillage progressif). Le joueur peut le **régénérer**, ce qui révoque l'ancien.
3. Sessions : JWT d'accès de 15 min, rafraîchissement par rotation, ticket de passerelle à usage unique de 60 s.
4. **Point d'extension, non construit** : `account.kind` prévoit `registered` ; les routes `/auth/register`, `/auth/login` et `/auth/upgrade` sont réservées ; le module `accounts` expose une interface `CredentialProvider` (implémentation unique au MVP : `DeviceTokenProvider`). Les autres modules ne connaissent que `accountId`.
5. Aucune donnée d'identité collectée (ni e-mail, ni téléphone) : minimisation maximale (loi 2013-450, RGPD).

## Alternatives écartées

| Option | Raison du rejet |
|---|---|
| Compte e-mail dès le MVP | Écarté par le propriétaire (friction à l'entrée) ; reste l'extension prévue |
| Connexion par SMS OTP | Coût par SMS, collecte du numéro de téléphone |
| Invité sans code de récupération | Perte définitive des biens au moindre nettoyage du navigateur |

## Conséquences

- Risque résiduel : code perdu = profil perdu (rappels dans l'UI). Si la bêta montre des pertes fréquentes, l'extension compte permanent sera priorisée.
- Création de profils facile, donc risque de fermes de comptes : limitation par IP, ancienneté minimale pour les transferts et l'emploi (ARCHITECTURE §3.5, §16.5).
