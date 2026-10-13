---
title: Aiming with the paddle
description: Steer the ball by where it lands on the paddle, and speed it up as you go.
estimatedMinutes: 15
---

In Breakout, *where* the ball lands on the paddle decides where it goes next: the left end sends it up and to the left, the middle sends it straight up, the right end sends it up and to the right. That's how you aim at the last few bricks.

## Hit offset

First, measure where the ball landed, from -1 (left end) to 1 (right end):

```text
offset = (ball.x - paddle.x) / (paddle.width / 2)
```

Multiply by a maximum angle (60°) and rotate `Vector2.UP` by the result. That's the new direction. Because it always starts from *up*, the ball can never be sent downwards into the paddle.

```gdscript title="ball.gd" ins={3,7-11,25-29,41-47}
extends CharacterBody2D

signal hit_paddle
signal hit_wall

@export var start_speed := 240.0
@export var max_speed := 480.0
## Speed multiplier applied on every paddle hit.
@export var speedup := 1.03
## Steepest angle the ball can leave the paddle at, measured from straight up.
@export var max_bounce_angle := 60.0

var speed := 0.0
## While set, the ball rides on this paddle, waiting to be launched.
var held_by: Node2D


func _physics_process(delta: float) -> void:
	if held_by:
		global_position = held_by.global_position + Vector2(0, -10)
		return
	var collision := move_and_collide(velocity * delta)
	if collision == null:
		return
	var collider := collision.get_collider()
	if collider.is_in_group("paddle"):
		_bounce_off_paddle(collider)
		hit_paddle.emit()
		return
	velocity = velocity.bounce(collision.get_normal())
	hit_wall.emit()


## Leave the paddle, heading up at a slightly random angle.
func launch() -> void:
	if held_by == null:
		return
	held_by = null
	speed = start_speed
	velocity = Vector2.UP.rotated(deg_to_rad(randf_range(-30.0, 30.0))) * speed


func _bounce_off_paddle(paddle: Node2D) -> void:
	# -1 at the paddle's left end, 0 in the middle, 1 at the right end.
	var offset := clampf((global_position.x - paddle.global_position.x) / (paddle.width / 2), -1.0, 1.0)
	speed = minf(speed * speedup, max_speed)
	velocity = Vector2.UP.rotated(deg_to_rad(max_bounce_angle) * offset) * speed
```

- `collision.get_collider()` is the body we hit. `is_in_group("paddle")` is why the paddle joined that group: the ball doesn't need a reference to the paddle to recognise it.
- `paddle.width` is the variable from `paddle.gd`. Reading it (instead of a hard-coded 32) means aiming still works when the paddle is wider.
- `clampf` keeps the offset in range even if the ball clips the paddle's very corner.
- Every paddle hit makes the ball 3% faster, up to 480 px/s. A long rally gets tense.

:::note[Why not straight sideways?]
At 90° the ball would bounce between the side walls forever without coming down. 60° keeps it moving up the screen at a decent pace.
:::

Breakout veterans will recognise the trick: the ball's angle only ever changes at the paddle. Walls and bricks mirror it, so a ball that leaves the paddle steeply stays steep until you change it.

```quiz
question: The ball lands exactly on the paddle's right end. Where does it go?
options:
  - Up and right, 60° from vertical
  - Straight up
  - Up and left, 60° from vertical
  - Down and right
answer: 0
explain: The offset is 1, so the angle is +60°. `Vector2.UP.rotated` turns clockwise, which is to the right.
```

```quiz
question: Starting at 240 px/s with a speedup of 1.03, after how many paddle hits does the ball reach the 480 px/s cap?
type: text
answer: ["24", "twenty-four", "twenty four"]
hint: 240 × 1.03ⁿ ≥ 480, so 1.03ⁿ ≥ 2.
explain: 1.03²³ ≈ 1.97 and 1.03²⁴ ≈ 2.03.
```
