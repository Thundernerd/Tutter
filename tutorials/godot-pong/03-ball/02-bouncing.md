---
title: Bouncing
description: move_and_collide, Vector2.bounce, and serving.
estimatedMinutes: 15
---

The paddle used `move_and_slide()`, which slides *along* surfaces. A ball should bounce *off* them instead, so it uses the lower-level `move_and_collide()`, which stops at the first contact and tells us about it.

```gdscript title="ball.gd"
extends CharacterBody2D

@export var start_speed := 300.0

var speed := 0.0


func _physics_process(delta: float) -> void:
	var collision := move_and_collide(velocity * delta)
	if collision:
		velocity = velocity.bounce(collision.get_normal())


## Put the ball in the middle and launch it left (-1) or right (1).
func serve(direction: float) -> void:
	position = get_viewport_rect().size / 2
	speed = start_speed
	var angle := randf_range(-0.5, 0.5) # radians, roughly ±30°
	velocity = Vector2(direction * cos(angle), sin(angle)) * speed


func reset() -> void:
	position = get_viewport_rect().size / 2
	velocity = Vector2.ZERO
```

A few things to notice:

- `move_and_collide` takes a **motion** (pixels this frame), not a velocity, so we multiply by `delta` ourselves.
- `collision.get_normal()` points away from the surface we hit. `bounce()` mirrors the velocity around it: hitting the top wall flips the y component and keeps x.
- `cos(angle)` and `sin(angle)` give a direction of length 1; multiplying by `speed` makes the speed exact, whatever the angle.

## Serve it

Give `game.tscn` a script so we can serve when the game starts:

```gdscript title="game.gd"
extends Node2D

@onready var ball: CharacterBody2D = $Ball


func _ready() -> void:
	ball.serve([-1.0, 1.0].pick_random())
```

`@onready` fills the variable just before `_ready()` runs, once the child nodes exist. `$Ball` is shorthand for `get_node("Ball")`.

Run it. The ball bounces off the walls and the paddles, and sails off-screen when you miss. We'll deal with that in the scoring chapter.

```quiz
question: Why does `move_and_collide` get `velocity * delta`, while `move_and_slide()` takes no argument?
options:
  - move_and_collide expects a motion for this frame, move_and_slide reads velocity itself
  - delta is only needed for balls
  - It's a mistake; both should get velocity * delta
answer: 0
explain: move_and_slide applies `velocity` and delta internally. move_and_collide moves by exactly the vector you pass.
```
