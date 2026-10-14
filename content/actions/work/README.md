# `content/actions/work/`

- **Owner:** backend developer (gameplay data)
- **Status:** Active — T-310

## Role

Work actions of the NPC jobs (`content/jobs/`): one shift per action (6–8 game hours, at most 10 real minutes with the ellipse), wage paid at completion by `system:wages` through the EconomyPort, energy cost, 24 game-hour cooldown (anti-farm: one paid shift per game day). Leaving before the end pays nothing (`refund_none_no_effects`).

## Rules

- The action windows repeat the job shifts; the job file references its work action (checked by content-cli).
