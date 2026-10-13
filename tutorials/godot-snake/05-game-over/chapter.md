---
title: Game over
summary: Crashing into walls and into yourself, and an optional wrap-around mode.
---

Snake has no physics engine, no collision shapes and no collision layers: two things collide when they are in the **same cell**. Every crash in this chapter is a comparison of `Vector2i`s, checked *before* the snake moves.
