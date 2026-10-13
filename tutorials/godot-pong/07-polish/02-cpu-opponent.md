---
title: CPU opponent
description: A simple, beatable AI for single-player matches.
estimatedMinutes: 15
---

Single-player needs an opponent. A good Pong AI isn't the one that never misses; it's the one that's fun to beat.

## Strategy

1. While the ball comes **towards** us, move towards its height.
2. While it moves **away**, drift back to the centre (a sensible waiting spot).
3. Move a bit **slower** than a human can, so fast, steep shots get past it.
4. Stop when close enough, so the paddle doesn't jitter around the target.

## Code

```gdscript title="paddle.gd" ins={8-14,18,24-33}
extends CharacterBody2D

const HALF_HEIGHT := 24.0

@export var speed := 400.0
@export var up_action := &"p1_up"
@export var down_action := &"p1_down"
## When true the paddle follows the ball instead of reading input.
@export var is_cpu := false
## The CPU moves slower than a player so it can be beaten.
@export_range(0.1, 1.0) var cpu_speed_factor := 0.7

## The ball to follow when `is_cpu` is on. Set by the game scene.
var ball: CharacterBody2D


func _physics_process(_delta: float) -> void:
	var direction := _cpu_direction() if is_cpu else Input.get_axis(up_action, down_action)
	velocity = Vector2(0, direction * speed)
	move_and_slide()
	position.y = clampf(position.y, HALF_HEIGHT, get_viewport_rect().size.y - HALF_HEIGHT)


func _cpu_direction() -> float:
	if ball == null:
		return 0.0
	# Chase the ball while it comes towards us, otherwise drift back to the middle.
	var coming_at_us := signf(ball.velocity.x) == signf(global_position.x - ball.global_position.x)
	var target_y := ball.global_position.y if coming_at_us else get_viewport_rect().size.y / 2
	var distance := target_y - global_position.y
	if absf(distance) < 8.0:
		return 0.0 # Close enough: don't jitter.
	return signf(distance) * cpu_speed_factor
```

The CPU returns a "direction" just like `Input.get_axis` does, so the rest of the movement code is shared. `@export_range` gives the Inspector a slider, which makes tuning difficulty painless.

"Coming at us" compares two signs: the direction the ball travels in x, and the direction from the ball to us. If they match, the ball is heading our way.

## Enable it from the options

In `game.gd`, hand the right paddle the ball and turn on the AI when the option is set:

```gdscript title="game.gd" ins={1,4-5}
@onready var right_paddle: CharacterBody2D = $RightPaddle

func _ready() -> void:
	right_paddle.is_cpu = Settings.vs_cpu
	right_paddle.ball = ball
	# ...
```

and pass `Settings.vs_cpu` to `game_over.show_winner(player, Settings.vs_cpu)` so the result screen says "You win!" instead of "Left player wins!".

:::tip[Difficulty levels]
Easy, normal and hard are just different `cpu_speed_factor` values (try 0.5, 0.7 and 0.9). Add an OptionButton to the options screen and a setting in `Settings`. You already know every step.
:::

```quiz
question: The ball is at x=300 moving right (velocity.x > 0). The CPU paddle is at x=616. Is the ball coming at the CPU?
options:
  - "Yes: sign(velocity.x) = 1 and sign(616 - 300) = 1"
  - "No: the ball is left of the paddle"
answer: 0
```
