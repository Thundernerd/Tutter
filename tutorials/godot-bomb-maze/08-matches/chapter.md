---
title: Matches
summary: A Match autoload that survives scene reloads, rounds with draws, a scoreboard, and sudden death.
---

A **match** is a series of **rounds**. Each round is one game of last-bomber-standing in a fresh arena; the first bomber to win enough rounds wins the match.

The simplest way to get a fresh arena is to reload the whole game scene: every block, bomb, monster and timer starts over, with no reset code at all. The catch is that reloading also throws away anything stored in the scene, like the scores. So the match state moves to an **autoload**, which lives outside the scene and survives the reload.
