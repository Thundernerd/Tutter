---
title: Screen shake
description: A Camera2D offset tween that jolts the playfield on hard drops.
estimatedMinutes: 10
---

A hard drop should feel heavy. A tiny downward jolt of the whole playfield, a few pixels for a fraction of a second, sells the impact.

## A camera to shake

Add a `Camera2D` to `game.tscn` at **(320, 180)**, the centre of the screen. A camera centred on the middle of the viewport shows exactly what we saw before, so nothing moves yet. Its `offset` shifts the view without moving the camera node itself, and we'll animate that.

Because the HUD, pause menu and game over screen are on `CanvasLayer`s, they ignore the camera and stay perfectly still while the well shakes. That's the reason we put them there in the first place.

## The shake

```gdscript title="game.gd" ins={2,6,11,16-19,24-35}
var _shift_timer := 0.0
var _shake_tween: Tween

@onready var board: Board = $Board
@onready var hud: CanvasLayer = $HUD
@onready var camera: Camera2D = $Camera2D

# ...

	piece_locked.connect($Sounds/Lock.play)
	hard_dropped.connect(_on_hard_dropped)
	lines_cleared.connect(_on_lines_cleared)

# ...

func _on_hard_dropped(distance: int) -> void:
	_shake(clampf(distance / 3.0, 1.0, 4.0))


func _on_lines_cleared(count: int) -> void:
	# Same sound, higher pitch for bigger clears.
	$Sounds/Clear.pitch_scale = 1.0 + 0.15 * (count - 1)
	$Sounds/Clear.play()


## Jolt the camera down by `strength` pixels, then wobble back into place.
func _shake(strength: float) -> void:
	if _shake_tween:
		_shake_tween.kill()
	_shake_tween = create_tween()
	_shake_tween.tween_property(camera, "offset", Vector2(0, strength), 0.03)
	for i in 3:
		var wobble := strength * 0.5 / (i + 1)
		_shake_tween.tween_property(camera, "offset", Vector2(randf_range(-wobble, wobble), randf_range(-wobble, wobble)), 0.03)
	_shake_tween.tween_property(camera, "offset", Vector2.ZERO, 0.05)
```

- **The jolt** goes straight down by `strength` pixels in 0.03 seconds. Then three random wobbles, each smaller than the last (up to a half, a quarter and a sixth of the strength), settle it, and a final step returns to zero. Tweeners added to the same tween run **one after another**, so the whole thing takes 0.03 + 3 × 0.03 + 0.05 = 0.17 seconds.
- **Strength** grows with the drop distance: one pixel for short drops, up to four for a drop from the top. `distance / 3.0` uses a float on purpose, so 5 rows give 1.67 px rather than 1.
- **`kill()` the previous tween.** Two tweens animating the same property fight each other, and the camera could end up stuck off-centre. Hard drops can come faster than 0.17 seconds apart, so we stop the old shake before starting a new one.

Play a few games. Between the sounds, the line clear animation, the ghost and the shake, Blockfall should now feel like a real game.

```quiz
question: Why do the HUD and menus not shake along with the well?
options:
  - They are on CanvasLayers, which ignore the camera
  - They are children of the camera
  - The shake only moves the board node
answer: 0
```

```quiz
question: What would go wrong without `_shake_tween.kill()`?
options:
  - Nothing
  - A second hard drop during a shake would start a tween fighting the first one over the camera offset
  - The camera would be freed
answer: 1
```
