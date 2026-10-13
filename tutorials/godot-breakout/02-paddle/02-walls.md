---
title: Walls and collision layers
description: A StaticBody2D frame, named physics layers, and clamping.
estimatedMinutes: 15
---

## The walls

Breakout's playfield has three walls: left, right and top. The bottom stays open, because that's where you lose the ball.

Walls never move, so they're a **StaticBody2D**: the cheapest kind of physics body, solid to everything that collides with it. Add one named `Walls` to `game.tscn`, with three `CollisionShape2D` children:

| Node | Position | Shape |
| --- | --- | --- |
| `Left` | (-2, 180) | RectangleShape2D, 20×360 |
| `Right` | (642, 180) | the same shape (drag it over or use **Copy**/**Paste**) |
| `Top` | (320, 22) | RectangleShape2D, 640×20 |

The shapes are 20px thick but only the last 8px of each side wall poke into the screen (x 0 to 8, and 632 to 640). The top wall's inner edge is at y = 32, which leaves a 24px strip at the very top for the score display.

Collision shapes are invisible in the game, so draw the frame with three `ColorRect`s, also children of `Walls`. Use colour `#333b54` and **Mouse → Filter: Ignore** on all three:

| ColorRect | Left | Top | Right | Bottom |
| --- | --- | --- | --- | --- |
| `LeftRect` | 0 | 24 | 8 | 360 |
| `RightRect` | 632 | 24 | 640 | 360 |
| `TopRect` | 0 | 24 | 640 | 32 |

:::tip
**Debug → Visible Collision Shapes** in the editor menu draws every collision shape while the game runs. Switch it on whenever physics does something surprising.
:::

## Collision layers

Each physics body sits on one or more **layers** (what it *is*) and has a **mask** (the layers it *collides with*). Name the layers first, so the Inspector shows names instead of numbers: **Project Settings → General → Layer Names → 2D Physics**.

| Layer | Name | Used by |
| --- | --- | --- |
| 1 | `walls` | the walls |
| 2 | `paddle` | the paddle |
| 3 | `ball` | balls |
| 4 | `bricks` | bricks |
| 5 | `pickups` | falling power-ups |
| 6 | `kill_zone` | the area below the screen that swallows lost balls |

Now set them:

- `Walls`: **Layer** `walls`, **Mask** empty. A static body never moves, so it never needs to look for anything.
- `Paddle` (in `paddle.tscn`): **Layer** `paddle`, **Mask** `walls`.

:::note[Who looks for whom]
The paddle doesn't have `ball` in its mask. If it did, `move_and_slide()` would stop the paddle whenever it touched the ball. Instead, the ball will have `paddle` in *its* mask: the ball reacts to the paddle, the paddle ignores the ball.
:::

## Clamping

Run the game: the walls already stop the paddle. So why clamp its position as well? Two reasons:

1. Physics keeps a tiny safety margin. In testing, the paddle stopped at x = 40.006 instead of exactly 40.
2. In the power-ups chapter, the paddle gets wider. If it's pressed against a wall when that happens, its new edge ends up *inside* the wall.

A clamp after moving fixes both:

```gdscript title="paddle.gd" ins={3-6,9-10,15-16}
extends CharacterBody2D

const NORMAL_WIDTH := 64.0
## The side walls are 8px thick.
const WALL := 8.0

@export var speed := 420.0

var width := NORMAL_WIDTH


func _physics_process(_delta: float) -> void:
	velocity.x = Input.get_axis(&"move_left", &"move_right") * speed
	move_and_slide()
	var half_width := width / 2
	position.x = clampf(position.x, WALL + half_width, get_viewport_rect().size.x - WALL - half_width)
```

`position` is the centre of the paddle, so the centre can get no closer to a wall than half the paddle's width. `get_viewport_rect().size.x` is the viewport width, 640. With a 64px paddle, x stays between 40 and 600.

`width` is a variable rather than a constant because a power-up will change it.

:::danger
Change `position` **after** `move_and_slide()`, not before. The physics step would otherwise move the body away from where you put it.
:::

```quiz
question: The paddle's layer is `paddle` and its mask is `walls`. The ball's mask includes `paddle`. When they touch, which body reacts?
options:
  - Only the ball
  - Only the paddle
  - Both
  - Neither
answer: 0
explain: A body only collides with the layers in its own mask. The ball looks for the paddle; the paddle doesn't look for the ball.
```

```quiz
question: Later the paddle widens to 96px. Between which x positions can its centre move then?
options:
  - 40 and 600
  - 56 and 584
  - 48 and 592
answer: 1
explain: 8 (wall) + 48 (half of 96) = 56, and 640 − 8 − 48 = 584.
```
