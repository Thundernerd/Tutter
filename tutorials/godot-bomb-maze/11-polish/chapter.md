---
title: Polish
summary: Sound effects, particles, screen shake and a death animation, all hung on signals we already have.
---

Almost every effect in this chapter connects to a signal that already exists: `bomb_placed`, `powered_up`, `died`, `exploded`, `block_destroyed`, `wall_dropped`. The gameplay code doesn't change at all. That's the payoff for emitting those signals chapters ago.
