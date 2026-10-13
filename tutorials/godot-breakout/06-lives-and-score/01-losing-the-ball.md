---
title: Losing the ball
description: An Area2D below the screen, lives, and why some calls must be deferred.
estimatedMinutes: 15
---

Right now a missed ball falls forever. We need to notice when it leaves the screen, take a life, and serve a new ball.

## The kill zone

An **Area2D** detects bodies entering and leaving it without blocking them, which is exactly what a "you missed" zone needs. Add one named `KillZone` to `game.tscn`, with a `CollisionShape2D` child:

| Node | Setting |
| --- | --- |
| `KillZone` | **Layer** `kill_zone`, **Mask** `ball` |
| `CollisionShape2D` | Position `(320, 400)`, RectangleShape2D `800×40` |

The zone spans y = 380 to 420, below the bottom edge of the screen at 360, and is wider than the screen so no angle can sneak past it. Its mask contains only `ball`, so pickups (and anything else we add later) fall through without triggering it.

:::tip[Thick enough?]
At its top speed of 480 px/s, the ball moves 8px per physics tick. A 40px zone can't be skipped.
:::

## Lives

Select `KillZone`, and in **Node → Signals** connect `body_entered` to `Game`:

```gdscript title="game.gd" ins={2,7,9-15}
const BALL_SCENE := preload("res://ball.tscn")
const START_LIVES := 3

@export var levels: Array[Level] = []

var level_index := 0
var lives := START_LIVES

func _on_kill_zone_body_entered(body: Node2D) -> void:
	body.queue_free()
	lives -= 1
	if lives == 0:
		get_tree().reload_current_scene.call_deferred() # A game over screen comes in the menus chapter.
	else:
		_reset_round.call_deferred()
```

`body` is the ball that fell in. It's freed, a life is lost, and either a new ball appears on the paddle or, with no lives left, the whole game restarts from level 1.

:::warning[Why `call_deferred`?]
Area signals like `body_entered` fire while the physics engine is in the middle of *flushing queries*: working out who overlaps whom. Adding a new physics body at that moment makes Godot complain: *Can't change this state while flushing queries. Use call_deferred() or set_deferred() to change monitoring state instead.* `call_deferred` waits until the end of the frame, when physics is done, and then calls the function.
:::

```quiz
question: Why is the kill zone an Area2D and not a StaticBody2D?
options:
  - Areas are cheaper
  - The ball should pass into it and we only want to know that it happened; a static body would bounce it back
  - StaticBody2D can't have a collision layer
answer: 1
```

```quiz
question: Inside `body_entered`, `_reset_round()` spawns a new ball. What do we need to use so that this happens safely?
type: text
answer: ["call_deferred", "call_deferred()", "_reset_round.call_deferred()"]
hint: The physics engine is still busy at that moment.
```
