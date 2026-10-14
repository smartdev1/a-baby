# `content/moderation/`

- **Owner:** moderation (list), backend developer (format)
- **Status:** Draft — T-318, to be completed by moderation

## Role

| File | Role |
|---|---|
| `chat-words.json` | Words masked in the proximity chat (`french`, `nouchi`), compared after normalisation: case, accents, leetspeak (`c0nn4rd`) and repeated letters (`connnard`) are ignored. Read by the zone at start-up (`apps/zone/src/chat/chat-setup.ts`). |

The nouchi list is empty: it must be written by someone who speaks it (moderation, owner). Phone numbers and links are masked by code, not by this list.

## Rules

- Keep this README up to date when the folder content changes.
- Words are compared whole (`contre` is never hit by a listed `con`); short words with an innocent meaning should still be added with care.
