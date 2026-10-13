---
title: Screen shake and flash
description: Camera offset tweens, replacing a running tween, and a full-screen flash.
estimatedMinutes: 15
---

Two last effects: the screen shakes a little when a brick breaks and a lot when you lose a life, and losing a life also flashes the screen red.

## A camera to shake

Add a `Camera2D` to `game.tscn` at `(320, 180)`, the centre of the screen. With the camera there, the view is exactly what it was before. A camera's **offset** moves the view without moving the camera node, so shaking means tweening `offset` to a few random spots and back to zero:

```gdscript title="game.gd" ins={2,4,6-15}
var lives := START_LIVES
var _shake_tween: Tween

@onready var camera: Camera2D = $Camera2D

func _shake(strength: float) -> void:
	if not Settings.screen_shake:
		return
	if _shake_tween:
		_shake_tween.kill() # A new shake replaces the old one.
	_shake_tween = create_tween()
	for i in 5:
		var offset := Vector2(randf_range(-strength, strength), randf_range(-strength, strength))
		_shake_tween.tween_property(camera, "offset", offset, 0.03)
	_shake_tween.tween_property(camera, "offset", Vector2.ZERO, 0.03)
```

- Steps on one tween run one after another: five jumps of 0.03 s, then back to the centre. 0.18 s in total.
- Bricks can break a few frames apart, especially with three balls. Two tweens animating the same property at once fight over it, so the previous shake is `kill`ed first.
- The **Screen shake** option from the options chapter switches it off. Some players get motion sick from screen shake, and it's a kind thing to offer.

The HUD, the menus and the flash below all live on `CanvasLayer`s, so they stay perfectly still while the playfield shakes.

## A flash

Add a `CanvasLayer` named `Flash` to `game.tscn` with **Layer** `5`: above the HUD (layer 1), below the menus (layer 10). Give it a `ColorRect` child with anchor preset **Full Rect**, **Mouse → Filter: Ignore**, and colour white at **0** alpha: invisible until we need it.

```gdscript title="game.gd" ins={1,3-5}
@onready var flash: ColorRect = $Flash/ColorRect

func _flash(color: Color) -> void:
	flash.color = color
	create_tween().tween_property(flash, "color:a", 0.0, 0.3)
```

`"color:a"` animates only the alpha part of `color`, so the flash fades out in whatever colour it started.

## Use them

```gdscript title="game.gd" ins={4-5,13}
func _on_kill_zone_body_entered(body: Node2D) -> void:
	# ...
	$Sounds/LoseLife.play()
	_shake(6.0)
	_flash(Color(1, 0.2, 0.2, 0.35))
	if lives == 0:


func _on_bricks_brick_destroyed(brick: Node2D) -> void:
	_add_points(brick.type.points)
	$Sounds/BrickBreak.play()
	_spawn_burst(brick.global_position, brick.type.color)
	_shake(1.5)
```

Lose your last life and look closely: the red flash stays frozen behind the game over screen. The flash colour is set straight away, but its fade is a tween, tweens are pausable, and the game over screen pauses the game in the same frame. A free freeze-frame.

:::tip[Why no flash for clearing a level?]
It's tempting to flash white when the last brick breaks. But the level complete screen pauses the game in the same frame, so the flash would freeze at full strength and wash out the whole screen behind it. Effects that should play *through* a pause need `tween.set_pause_mode(Tween.TWEEN_PAUSE_PROCESS)`; or, simpler, play the effect on the screen that's shown.
:::

That's the whole game. Play it through all four levels, and try every option.

```quiz
question: Why is the previous shake tween killed before starting a new one?
options:
  - Godot only allows one tween per node
  - Two tweens animating camera.offset at the same time would fight over it
  - Killing tweens saves memory
answer: 1
```

```quiz
question: On which CanvasLayer layer should the flash go, if the HUD is on layer 1 and the menus on layer 10?
options:
  - "0"
  - Something between 1 and 10, like 5
  - "11"
answer: 1
explain: Higher layers draw on top. The flash should cover the HUD, but never the menus.
```
