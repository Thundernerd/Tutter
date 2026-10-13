---
title: Lives, score and waves
summary: A HUD, three lives and a bonus one, invaders that can land, endless waves, and a high score saved to disk.
---

This chapter turns the toy into a game with rules. By the end, `game.gd` is the referee: it keeps score, counts lives, starts waves and decides when it's over. The other scenes still know nothing about each other; they only emit signals the game listens to.
