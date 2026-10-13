---
title: Winning and losing
summary: Show every mine when you lose, detect a win, add chording, and play with the keyboard.
---

By the end of this chapter the rules are complete. Everything after it (HUD, menus, options, polish) is built around a model that won't change much again.

The board also gets its first **signals**: `game_lost` and `game_won`. The board knows *when* the game ends, but deciding *what happens next* (a sad face, a result screen, a sound) isn't its job. It announces the event, and whoever cares can listen.
