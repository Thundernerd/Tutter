---
title: Lives
description: Three lives, a lives display, and what happens when a ghost catches you.
estimatedMinutes: 20
---

Getting caught currently restarts the whole game. Let's give the player three lives instead.

## Showing the lives

The arcade games showed one small player icon for each **spare** life, not counting the one being played. Add to `hud.tscn`, on the right panel:

| Node | Position | Size | Notes |
| --- | --- | --- | --- |
| `LivesTitle` (Label) | (20, 100) | 140×16 | "LIVES", font size 11, grey |
| `LivesBox` (HBoxContainer, %) | (20, 120) | 140×14 | separation 4 |

And in `hud.gd`:

```gdscript title="hud.gd"
## The icon shown for every spare life.
@export var life_texture: Texture2D

@onready var lives_box: HBoxContainer = %LivesBox


func update_lives(lives: int) -> void:
	for icon in lives_box.get_children():
		icon.queue_free()
	# The life being played isn't shown, only the spare ones.
	for i in lives - 1:
		var icon := TextureRect.new()
		icon.texture = life_texture
		icon.flip_h = true
		lives_box.add_child(icon)
```

For **Life Texture**, choose **New AtlasTexture** in the Inspector, set its **Atlas** to `art/player.png` and its **Region** to `(14, 0, 14, 14)`: the middle frame, mouth half open. An `AtlasTexture` shows part of another texture, so you don't need a separate image file for the icon. `flip_h` makes the icons face left, towards the maze.

Rebuilding the icons from scratch on every change is simpler than adding or removing one, and it happens at most once per round.

## Losing a life

When a ghost catches you, the arcade sequence goes:

1. Everything freezes for a second.
2. The ghosts disappear and the player... disappears too, for now. (Chapter 10 adds a proper death animation.)
3. One life fewer. If none are left, it's game over.
4. Otherwise, start a new round: "READY!", everyone back in place, but the eaten pellets stay eaten.

```gdscript title="game.gd"
var lives := 3


func _lose_life() -> void:
	_set_world_running(false)
	await _wait(1.0)
	for ghost: Ghost in ghosts:
		ghost.hide()
	player.sprite.hide()
	await _wait(1.0)
	lives -= 1
	hud.update_lives(lives)
	if lives == 0:
		get_tree().reload_current_scene() # Game over, for now.
		return
	await _wait(0.5)
	_start_round()
```

Replace the `reload_current_scene()` call in `_physics_process` with `_lose_life()`, and call `hud.update_lives(lives)` in `_ready`. In `player.gd`, make `reset()` show the sprite again by adding `sprite.show()` before `sprite.play(&"move")`.

Notice how `_lose_life` reads like the list above, top to bottom, even though it takes seconds to run. That's what `await` buys you: no state variables to track "which step of the death sequence are we in?". Each `await` pauses the function and the game carries on; when the timer fires, the function resumes on the next line.

:::warning[Only once]
`_lose_life` sets `playing = false` immediately (through `_set_world_running(false)`), before its first `await`. Without that, the touch check would call it again on the very next frame, while the player and ghost are still overlapping, and you'd lose all your lives in one go.
:::

Because `_pellets_this_life` resets in `_start_round`, the ghosts in the house wait for 30 and 60 fresh pellets again after you lose a life. That gives you a quieter restart, as in the original.

```quiz
question: You have 3 lives. How many icons does the HUD show at the start of the game?
options:
  - "3"
  - "2"
  - "0"
answer: 1
explain: The life you're playing isn't shown, only the spare ones.
```

```quiz
question: What would happen if `_lose_life` didn't freeze the world before its first `await`?
options:
  - Nothing different
  - The touch check would call `_lose_life` again every frame while the player and ghost overlap
  - The death sequence would play faster
answer: 1
```
