---
title: Two paddles
description: Instance the paddle scene twice and give each its own controls.
estimatedMinutes: 10
---

## Instancing

Open `game.tscn`. Drag `paddle.tscn` from the FileSystem dock onto `Game` **twice**. Each copy is an *instance*: they share the scene, but every instance can override properties.

| Node | Position | Up Action | Down Action |
| --- | --- | --- | --- |
| `LeftPaddle` | (24, 180) | `p1_up` | `p1_down` |
| `RightPaddle` | (616, 180) | `p2_up` | `p2_down` |

Overridden properties show a ↺ revert arrow in the Inspector. Change `speed` in `paddle.gd` and both paddles follow, unless you've overridden it on an instance.

Add a thin `ColorRect` named `CenterLine` too: position x 319, size 2×360, colour white at 20% alpha. Pure decoration.

Run the game: <kbd>W</kbd>/<kbd>S</kbd> and <kbd>↑</kbd>/<kbd>↓</kbd> move the two paddles.

## Collision layers

Before the ball arrives, let's decide who collides with whom. Physics bodies have a **layer** (what they *are*) and a **mask** (what they *look for*). Name the layers in **Project Settings → Layer Names → 2D Physics**:

| Layer | Name | Used by |
| --- | --- | --- |
| 1 | `walls` | top and bottom walls |
| 2 | `paddles` | both paddles |
| 3 | `ball` | the ball |
| 4 | `goals` | the scoring zones behind each paddle |

In `paddle.tscn`, set the paddle's **Collision → Layer** to `paddles` only, and its **Mask** to `walls` only.

:::note[Why paddles don't see the ball]
If paddles had the ball in their mask, `move_and_slide()` would stop a paddle dead when it touched the ball. The ball will look for paddles instead, so the collision still happens, but only the ball reacts to it.
:::

```quiz
question: A body is on layer 3 with mask 1 and 2. Which statement is true?
options:
  - It detects bodies on layer 3
  - It detects bodies on layers 1 and 2
  - Bodies on layers 1 and 2 detect it
answer: 1
explain: The **mask** lists the layers a body scans for. Whether others detect it depends on *their* masks.
```
