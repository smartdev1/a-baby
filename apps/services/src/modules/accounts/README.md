# `apps/services/src/modules/accounts/`

- **Owner:** backend developer
- **Status:** Active — T-324 (J6-02, file store until the database J6-01)

## Role

Guest profiles (ARCHITECTURE §14.1, §20.3); extension point for permanent accounts.

| File | Role |
|---|---|
| `application/account-service.ts` | Guest creation (256-bit device token, also the recovery code), sessions from the device token, 15-min access tokens; `GuestAccountStore` port; only SHA-256 hashes kept |
| `infra/guest-account-stores.ts` | In-memory store (tests) and JSON file store `data/runtime/guest-accounts.json` (ids, hashes, creation times) |
| `api/account-routes.ts` | `POST /api/v1/auth/guest` (5/min/IP), `POST /api/v1/auth/guest/session` (10/min/IP), `GET /api/v1/me`; `bearerAccount()` for other routes |

No identity data at all (no e-mail, name, phone). Session tickets are bound to the account (`session-tickets/`); the gateway passes it to the zone as the character id, so the starter grant and the wallet follow the character, and a second login takes the existing session over.

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
