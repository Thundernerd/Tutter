---
title: Bouncing
description: Collision normals and Vector2.bounce.
estimatedMinutes: 10
---

`move_and_collide` stops at the first contact and returns a `KinematicCollision2D` describing it, or `null` when nothing was in the way. The most useful thing in it is the **normal**: a length-1 vector pointing straight out of the surface that was hit.

| Hit | Normal |
| --- | --- |
| The left wall | `(1, 0)` |
| The right wall | `(-1, 0)` |
| The top wall | `(0, 1)` |
| The top of the paddle | `(0, -1)` |

`velocity.bounce(normal)` mirrors the velocity off that surface: the part of the velocity along the normal flips, the rest stays. Hit the left wall and only `x` changes sign; hit the top and only `y` does.

```gdscript title="ball.gd" ins={3-4,17-21} del={16}
extends CharacterBody2D

signal hit_wall

@export var start_speed := 240.0

var speed := 0.0
## While set, the ball rides on this paddle, waiting to be launched.
var held_by: Node2D


func _physics_process(delta: float) -> void:
	if held_by:
		global_position = held_by.global_position + Vector2(0, -10)
		return
	move_and_collide(velocity * delta)
	var collision := move_and_collide(velocity * delta)
	if collision == null:
		return
	velocity = velocity.bounce(collision.get_normal())
	hit_wall.emit()
```

`hit_wall` is a **signal**: the ball announces "I bounced" without knowing or caring who listens. Nobody listens yet. In the polish chapter, a sound will.

Run it. The ball bounces around the walls and off the paddle, and drops out of the bottom if you miss. We'll catch it when we add lives. Until then, press <kbd>F5</kbd> again.

:::note
Bouncing keeps the ball's speed, but not your control over its direction: the angle never changes, however you hit it. Fixing that is what makes Breakout playable, and it's the next page.
:::

```quiz
question: The ball moves with velocity (-100, -200) and hits the left wall (normal (1, 0)). What is its velocity after `bounce`?
options:
  - (100, -200)
  - (-100, 200)
  - (100, 200)
answer: 0
explain: Only the component along the normal (x) flips. The ball keeps going up.
```
