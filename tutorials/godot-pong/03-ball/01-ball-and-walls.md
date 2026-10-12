---
title: Ball and walls
description: A second CharacterBody2D and some static walls to bounce off.
estimatedMinutes: 10
---

## The ball scene

The ball is built just like the paddle. New scene, `CharacterBody2D` root named `Ball`, saved as `ball.tscn`:

```text
Ball (CharacterBody2D)   # Motion Mode: Floating
├── CollisionShape2D     # RectangleShape2D, 8×8
└── ColorRect            # 8×8, offset left -4, top -4
```

Collision: **Layer** `ball`, **Mask** `walls` and `paddles`.

Instance it in `game.tscn` at (320, 180).

## Walls

Walls never move, so they're a `StaticBody2D`. Add one named `Walls` to `game.tscn` with two `CollisionShape2D` children:

| Node | Position | Shape |
| --- | --- | --- |
| `Top` | (320, -10) | RectangleShape2D 680×20 |
| `Bottom` | (320, 370) | RectangleShape2D 680×20 (same resource) |

The walls sit just *outside* the screen, so they're invisible but the ball can't escape vertically. Set the body's **Layer** to `walls` and clear its **Mask**: static bodies never look for anything.

:::tip
Enable **Debug → Visible Collision Shapes** in the editor's top menu to see the walls while the game runs.
:::

```quiz
question: Which body type fits the walls best?
options:
  - RigidBody2D
  - CharacterBody2D
  - StaticBody2D
  - Area2D
answer: 2
explain: Static bodies don't move and cost almost nothing. Others collide with them as solid objects.
```
