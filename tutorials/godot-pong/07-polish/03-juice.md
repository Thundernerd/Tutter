---
title: Juice
description: Tweens for a paddle flash and a screen shake.
estimatedMinutes: 10
---

"Juice" is the small feedback that makes a game feel alive. Two tiny effects go a long way in Pong: the paddle flashes when hit, and the screen shakes when someone scores. Both use **tweens**, which animate a property over time from code.

## Paddle flash

```gdscript title="paddle.gd"
## Briefly brighten the paddle. Called by the ball on impact.
func flash() -> void:
	modulate = Color(2.5, 2.5, 2.5)
	create_tween().tween_property(self, "modulate", Color.WHITE, 0.15)
```

`modulate` multiplies the node's colour. Values above 1 brighten it; tweening back to white restores the original over 0.15 seconds. Call it from the ball:

```gdscript title="ball.gd" ins={5-6}
func _bounce_off_paddle(paddle: Node2D) -> void:
	# ...
	speed = minf(speed * speedup, max_speed)
	velocity = Vector2(direction * cos(angle), sin(angle)) * speed
	if paddle.has_method("flash"):
		paddle.flash()
```

`has_method` keeps the ball usable with any paddle-like body, even ones without a `flash` method.

## Screen shake

Add a `Camera2D` to `game.tscn` at (320, 180), the centre of the screen. A camera's `offset` moves the view without moving the camera node itself:

```gdscript title="game.gd"
@onready var camera: Camera2D = $Camera2D


func _shake() -> void:
	var tween := create_tween()
	for i in 6:
		var offset := Vector2(randf_range(-4, 4), randf_range(-4, 4))
		tween.tween_property(camera, "offset", offset, 0.03)
	tween.tween_property(camera, "offset", Vector2.ZERO, 0.03)
```

Tweeners added to the same tween run **one after another**, so this jumps through six random offsets in 0.18s, then settles back. Call `_shake()` in `_score()`.

Because the HUD and menus are on `CanvasLayer`s, they stay perfectly still while the court shakes.

```quiz
question: Six `tween_property` calls on one tween, each 0.03s. How long does the shake take before the final reset step?
type: text
answer: ["0.18", "0.18s", ".18", "180ms", "180 ms"]
explain: Steps on a single tween run in sequence by default, so 6 × 0.03s = 0.18s.
```
