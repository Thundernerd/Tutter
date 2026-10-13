---
title: Juice
description: Particle debris, a screen shake and a red flash, with an off switch.
estimatedMinutes: 20
---

"Juice" is the small feedback that makes a game feel alive. Three effects go a long way here: pixel debris when something explodes, the screen shaking when you're hit (and a little when the UFO goes down), and a red flash on death.

## Debris particles

Godot has two 2D particle nodes. `GPUParticles2D` runs on the graphics card and scales to thousands of particles; `CPUParticles2D` runs on the processor and keeps every setting directly on the node. For a dozen pixels per explosion, the CPU version is simpler.

New scene, `CPUParticles2D` root named `Debris`, saved as `debris.tscn`:

| Property | Value | Why |
| --- | --- | --- |
| Emitting | on | Start bursting as soon as it's spawned |
| Amount | `14` | Particles per burst |
| Time → Lifetime | `0.6` | Seconds each particle lives |
| Time → One Shot | on | One burst, then stop |
| Time → Explosiveness | `1` | All particles at once instead of spread over the lifetime |
| Direction → Spread | `180` | Every direction |
| Gravity | (0, 240) | Debris falls |
| Initial Velocity → Min / Max | `40` / `120` | Some fly further than others |
| Scale → Scale Amount Min / Max | `2` / `2` | 2×2 squares, matching the art's pixels |
| Color → Color Ramp | white → transparent | Particles fade out |

Without a texture, each particle is a plain white square, which is exactly the look we want.

Like the explosion, the debris cleans up after itself without a script: connect its own `finished` signal to its own `queue_free()`. A one-shot particle node emits `finished` once its last particle has died.

Spawn it with the `_spawn` helper from chapter 4:

```gdscript title="game.gd" ins={3}
const EXPLOSION_SCENE := preload("res://explosion.tscn")
const UFO_SCENE := preload("res://ufo.tscn")
const DEBRIS_SCENE := preload("res://debris.tscn")
```

```gdscript title="game.gd" ins={4}
func _on_formation_invader_killed(invader: Invader) -> void:
	_add_score(invader.get_points())
	_spawn(EXPLOSION_SCENE, invader.global_position)
	_spawn(DEBRIS_SCENE, invader.global_position)
	$Sounds/InvaderKilled.play()
```

## Shake and flash

Add a `Camera2D` to `game.tscn` at (320, 180), the centre of the screen. A camera's `offset` moves the view without moving the camera node itself.

For the flash, add a `CanvasLayer` named `Effects` with **Layer** `4` (above the game and HUD, below the banner and menus) and a `ColorRect` child named `Flash`:

| `Flash` property | Value |
| --- | --- |
| Anchors | Full Rect |
| Color | red, **alpha 0** (`#ff333300`) |
| Mouse → Filter | Ignore |
| Access as Unique Name | yes |

It's always there, just fully transparent until we need it.

```gdscript title="game.gd" ins={2-3}
@onready var ufo_timer: Timer = $UfoTimer
@onready var camera: Camera2D = $Camera2D
@onready var flash: ColorRect = %Flash
```

```gdscript title="game.gd"
func _shake(strength := 4.0) -> void:
	if not Settings.screen_effects:
		return
	var tween := create_tween()
	for i in 8:
		var offset := Vector2(randf_range(-strength, strength), randf_range(-strength, strength))
		tween.tween_property(camera, "offset", offset, 0.03)
	tween.tween_property(camera, "offset", Vector2.ZERO, 0.03)


func _flash() -> void:
	if not Settings.screen_effects:
		return
	flash.color.a = 0.35
	create_tween().tween_property(flash, "color:a", 0.0, 0.3)
```

- A **tween** animates a property over time from code. Tweeners added to the same tween run **one after another**, so the shake jumps through eight random offsets in 0.24 seconds, then settles back to zero.
- `strength := 4.0` is a default argument: `_shake()` shakes by up to 4 pixels, `_shake(2.0)` more gently.
- `"color:a"` animates just the alpha channel of the colour: the flash snaps to 35% red and fades out over 0.3 seconds.
- Both check `Settings.screen_effects`, the option from the previous chapter.

Because the HUD, banner and menus are on `CanvasLayer`s, they stay perfectly still while the playfield shakes.

## Putting it together

The death sequence gets everything at once:

```gdscript title="game.gd" ins={7-9}
func _on_player_died() -> void:
	lives -= 1
	hud.set_lives(lives)
	formation.stop()
	_clear_shots()
	$Sounds/PlayerExplosion.play()
	_spawn(DEBRIS_SCENE, player.global_position)
	_shake()
	_flash()
	if lives <= 0:
		_end_game()
		return
	respawn_timer.start()
	await respawn_timer.timeout
	player.respawn()
	formation.start()
```

And downing the mystery ship earns a small rumble:

```gdscript title="game.gd" ins={3}
func _on_ufo_destroyed(points: int) -> void:
	_add_score(points)
	_shake(2.0)
```

Play a wave. Invaders burst into falling pixels, the ground jolts when you're hit, and the whole thing feels a lot more solid than it did a page ago.

```quiz
question: Eight `tween_property` calls of 0.03 s on one tween, then the reset. How long is the whole shake?
type: text
answer: ["0.27", "0.27s", ".27", "270ms", "270 ms"]
explain: Steps on a single tween run in sequence by default, so 9 × 0.03 s = 0.27 s.
```

```quiz
question: Why does the Flash live on a CanvasLayer instead of directly under Game?
options:
  - ColorRects only render on CanvasLayers
  - A CanvasLayer is drawn in screen space, so the flash always covers the whole screen, even while the camera is shaking
  - CanvasLayers make colours brighter
answer: 1
explain: Nodes under Game are drawn through the camera. Shift the camera's offset and a full-screen rect under Game would slide off one edge.
```
