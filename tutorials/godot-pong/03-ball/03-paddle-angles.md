---
title: Aiming with the paddle
description: Control the bounce angle and speed up every rally.
estimatedMinutes: 15
---

With a plain bounce, the ball's angle never changes, and you can't aim. In real Pong, where the ball hits the paddle decides where it goes: the top edge sends it up, the centre sends it straight, the bottom edge sends it down.

## Hit offset

Measure how far from the paddle's centre the ball hit, as a value from -1 to 1:

```text
offset = (ball.y - paddle.y) / 24      # 24 = half the paddle height
```

Turn that into an angle (up to ±50°) and launch the ball *away* from the paddle:

```gdscript title="ball.gd" ins={1-2,5-9,16-22,24,27-34}
signal hit_paddle
signal hit_wall

@export var start_speed := 300.0
@export var max_speed := 900.0
## Speed multiplier applied on every paddle hit.
@export var speedup := 1.06
## Steepest angle the ball can leave a paddle at, in degrees.
@export var max_bounce_angle := 50.0

var speed := 0.0


func _physics_process(delta: float) -> void:
	var collision := move_and_collide(velocity * delta)
	if collision == null:
		return
	var collider := collision.get_collider()
	if collider.is_in_group("paddles"):
		_bounce_off_paddle(collider)
		hit_paddle.emit()
	else:
		velocity = velocity.bounce(collision.get_normal())
		hit_wall.emit()


func _bounce_off_paddle(paddle: Node2D) -> void:
	# -1 when hitting the paddle's top edge, 0 in the middle, 1 at the bottom.
	var offset := clampf((global_position.y - paddle.global_position.y) / 24.0, -1.0, 1.0)
	var angle := deg_to_rad(max_bounce_angle) * offset
	# Always travel away from the paddle that was hit.
	var direction := signf(global_position.x - paddle.global_position.x)
	speed = minf(speed * speedup, max_speed)
	velocity = Vector2(direction * cos(angle), sin(angle)) * speed
```

- `is_in_group("paddles")` is why we added paddles to that group earlier: the ball doesn't need to know *which* paddle it hit, only that it was one.
- The direction comes from the ball's position relative to the paddle, not from flipping the velocity. That makes it impossible for the ball to get "stuck" inside a paddle bouncing back and forth.
- Each paddle hit multiplies the speed by 1.06, up to 900 px/s: long rallies get tense.
- The two **signals** don't do anything yet. Later, sounds and effects will listen to them without the ball knowing they exist.

:::note[Why cap the angle?]
At 90° the ball would go straight up and down forever. 50° keeps it moving across the court.
:::

```quiz
question: The ball hits the right paddle exactly at its top edge. Where does it go?
options:
  - Left and up, at 50°
  - Left and straight
  - Right and up
  - Left and down, at 50°
answer: 0
explain: offset is -1 at the top, so the angle is -50° (up, because y points down), and direction is -1 (away from the right paddle).
```

```quiz
question: After how many paddle hits does a 300 px/s ball reach the 900 px/s cap (speedup 1.06)?
type: text
answer: ["19", "nineteen"]
hint: 300 × 1.06ⁿ ≥ 900, so 1.06ⁿ ≥ 3.
explain: 1.06¹⁹ ≈ 3.03, while 1.06¹⁸ ≈ 2.85.
```
