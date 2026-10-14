# `apps/zone/src/chat/`

- **Owner:** backend developer
- **Status:** Active — T-318 (J5-08)

## Role

Proximity chat (ARCHITECTURE §14.2, §20.2), text only, no private messages.

| File | Role |
|---|---|
| `chat-filter.ts` | Control characters removed; phone numbers (8+ digits) and links masked `***`; blocked words masked after normalisation (case, accents, leetspeak, repeated letters), compared whole |
| `token-bucket.ts` | 1 message/s, burst of 5, per sender |
| `proximity-chat.ts` | Delivery within 30 m to at most the 64 nearest (sender's echo included; in a 300-bot crowd an uncapped line reached ≈ 290 players), blocks both ways (carried in `CellHandoff.chatBlocked`), reports with an excerpt of the reported player's messages heard by the reporter in the last 5 min |
| `chat-setup.ts` | Loads the word list `content/moderation/chat-words.json` |

Chat text is kept in memory only for report excerpts (last 500 deliveries, 5 min) and is never logged. Mute is client-side (hide a player); block is server-side. Players near a cell border do not hear the neighbour cell yet (ghosts, J5-03).

## Rules

- Every source file starts with a `Role:` header comment.
- Keep this README up to date when the folder content changes.
- See `ARCHITECTURE.md` and `docs/rules/` for the full rules.
