---
title: Wide paddle and slow ball
description: Timer nodes for effects that wear off, tween_method, and match.
estimatedMinutes: 20
---

Two of our power-ups last a while and then wear off. A **Timer** node is the natural fit: start it when the effect begins, undo the effect when it times out. Timers belong to the scene, so they pause with the game and vanish with it.

## A wider paddle

Add a `Timer` named `WideTimer` to `paddle.tscn`, with **One Shot** on, and connect its `timeout` signal to `Paddle`. Then:

```gdscript title="paddle.gd" ins={4,14-16,20-44}
extends CharacterBody2D

const NORMAL_WIDTH := 64.0
const WIDE_WIDTH := 96.0
## The side walls are 8px thick.
const WALL := 8.0

@export var speed := 420.0
## Follow the mouse instead of the keyboard. This becomes a setting in the options chapter.
@export var use_mouse := true

var width := NORMAL_WIDTH

@onready var shape: RectangleShape2D = $CollisionShape2D.shape
@onready var rect: ColorRect = $ColorRect
@onready var wide_timer: Timer = $WideTimer

# ... _physics_process stays the same ...

## Widen the paddle for `duration` seconds. Catching another one restarts the clock.
func widen(duration: float) -> void:
	wide_timer.start(duration)
	_tween_width(WIDE_WIDTH)


## Back to normal straight away, e.g. after losing a life.
func reset_width() -> void:
	wide_timer.stop()
	_set_width(NORMAL_WIDTH)


func _on_wide_timer_timeout() -> void:
	_tween_width(NORMAL_WIDTH)


func _tween_width(target: float) -> void:
	create_tween().tween_method(_set_width, width, target, 0.2)


func _set_width(value: float) -> void:
	width = value
	shape.size.x = value
	rect.size.x = value
	rect.position.x = -value / 2
```

- The paddle's width lives in three places: the collision shape, the rectangle, and our `width` variable (which the clamp and the ball's aiming read). `_set_width` updates all three, and moves the rectangle's left edge so it stays centred.
- `tween_property` animates *one* property. Here we need a function called with every in-between value, which is what `tween_method` does: `_set_width(64)`, `_set_width(66.3)`, ... up to `_set_width(96)` over 0.2 seconds.
- `wide_timer.start(duration)` restarts the timer if it's already running, so catching a second **W** extends the effect.

:::note[Shared shapes]
A shape created inside a scene is shared by every instance of that scene. With one paddle that's fine. With two paddles, widening one would widen both, unless you tick **Resource → Local To Scene** on the shape.
:::

## A slow ball

The ball gets a speed multiplier that only affects how far it moves, not its "real" speed. That way the paddle's speed-up keeps counting while the effect is on, and switching it off is just setting the multiplier back to 1:

```gdscript title="ball.gd" ins={2-3,13} del={12}
var speed := 0.0
## 1 normally. The slow-ball power-up lowers it for a while.
var speed_scale := 1.0
## While set, the ball rides on this paddle, waiting to be launched.
var held_by: Node2D


func _physics_process(delta: float) -> void:
	if held_by:
		global_position = held_by.global_position + Vector2(0, -10)
		return
	var collision := move_and_collide(velocity * delta)
	var collision := move_and_collide(velocity * speed_scale * delta)
```

## Applying the effects

Add a one-shot `Timer` named `SlowTimer` to `game.tscn` and connect its `timeout` to `Game`:

```gdscript title="game.gd" ins={2-3,6-7,10,18-19,26-39} del={25}
const START_LIVES := 3
## How fast balls move while the slow-ball power-up is active.
const SLOW_SCALE := 0.6

@export_range(0.0, 1.0) var drop_chance := 0.15
@export var wide_duration := 12.0
@export var slow_duration := 10.0

@onready var pickups: Node2D = $Pickups
@onready var slow_timer: Timer = $SlowTimer


func _reset_round() -> void:
	for ball in balls.get_children():
		ball.queue_free()
	for pickup in pickups.get_children():
		pickup.queue_free()
	paddle.reset_width()
	slow_timer.stop()
	var ball := _spawn_ball()
	ball.held_by = paddle


func _on_pickup_collected(kind: Pickup.Kind) -> void:
	print("Caught ", Pickup.Kind.keys()[kind])
	match kind:
		Pickup.Kind.WIDE:
			paddle.widen(wide_duration)
		Pickup.Kind.MULTI:
			pass # Next page.
		Pickup.Kind.SLOW:
			slow_timer.start(slow_duration)
			for ball in balls.get_children():
				ball.speed_scale = SLOW_SCALE


func _on_slow_timer_timeout() -> void:
	for ball in balls.get_children():
		ball.speed_scale = 1.0
```

`match` compares a value against several patterns and runs the first branch that fits, like a tidy chain of `if kind == ...: elif ...:`.

Losing a life cancels both effects: the new round starts with a normal paddle and a normal ball.

```quiz
question: You catch a W, and 8 seconds later another W. When does the paddle shrink back (wide_duration is 12)?
options:
  - 12 seconds after the first W
  - 12 seconds after the second W
  - 24 seconds after the first W
answer: 1
explain: Calling `start()` on a running timer restarts it from the full duration.
```

```quiz
question: Which Tween method calls a function with every in-between value?
type: text
answer: ["tween_method", "tween_method()"]
```
