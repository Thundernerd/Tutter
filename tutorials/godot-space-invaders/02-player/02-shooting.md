---
title: Shooting
description: A shot scene, instancing from code, and the one-shot rule.
estimatedMinutes: 15
---

## The shot scene

New scene, `Area2D` root named `PlayerShot`:

```text
PlayerShot (Area2D)
├── CollisionShape2D   # RectangleShape2D, 2×8
└── ColorRect          # 2×8, offset left -1, top -4 (centred), white
```

A plain `ColorRect` is enough for a laser bolt. Set its **Mouse → Filter** to **Ignore**: UI nodes catch mouse clicks by default, and a stray shot shouldn't.

Save it as `player_shot.tscn` and attach a new script, `shot.gd`:

```gdscript title="shot.gd"
extends Area2D
## A shot that flies straight up or down. The player's and the invaders' shots share this script.

## Pixels per second. Negative flies up, positive flies down.
@export var speed := -420.0


func _physics_process(delta: float) -> void:
	position.y += speed * delta
	if position.y < -16.0 or position.y > get_viewport_rect().size.y + 16.0:
		queue_free()
```

The script doesn't say "player" anywhere. In chapter 4 the invaders' shots will use the very same script with a positive `speed`.

`queue_free()` deletes the node at the end of the current frame. Shots that leave the screen must free themselves, or they'd fly on forever, invisible, using memory.

## Firing from the ship

Update `player.gd`:

```gdscript title="player.gd" ins={4,10,17-19,22-25}
extends Area2D
## The player's laser cannon. Moves along the bottom and fires one shot at a time.

const SHOT_SCENE := preload("res://player_shot.tscn")
## How close the ship's centre may get to the screen edge.
const MARGIN := 20.0

@export var speed := 160.0

var _shot_in_flight: Area2D


func _physics_process(delta: float) -> void:
	var direction := Input.get_axis("move_left", "move_right")
	position.x += direction * speed * delta
	position.x = clampf(position.x, MARGIN, get_viewport_rect().size.x - MARGIN)
	# Like the arcade: no new shot until the last one is gone.
	if Input.is_action_just_pressed("shoot") and not is_instance_valid(_shot_in_flight):
		_shoot()


func _shoot() -> void:
	_shot_in_flight = SHOT_SCENE.instantiate()
	_shot_in_flight.position = position + Vector2(0, -12)
	add_sibling(_shot_in_flight)
```

- `preload` loads the scene once, when the script loads. `instantiate()` then stamps out a fresh copy of it whenever we need one.
- **The one-shot rule.** The original arcade only allowed one player shot on screen. We remember the shot in `_shot_in_flight`, and `is_instance_valid()` tells us whether it still exists. It returns `false` for `null` (no shot yet) *and* for a shot that has been freed, so the check covers both.
- `add_sibling` puts the shot next to the player, under `Game`. Making it a *child* of the player would be a bug: children move with their parent, so the shot would slide sideways whenever you moved.

:::note[A miss costs you]
Because you can't fire again until your shot is gone, missing means waiting for it to leave the screen. That's the heart of Space Invaders: you aim, you don't spray.
:::

Run the game and fire away. Shots fly off the top; you can't fire a second one until the first has gone.

```quiz
question: What happens if the shot is added with `add_child(_shot_in_flight)` instead of `add_sibling`?
options:
  - Nothing changes
  - The shot moves sideways along with the ship
  - The shot can't be freed
answer: 1
explain: A child's position is relative to its parent, so moving the ship would drag every shot it fired along with it.
```

```quiz
question: Which values make `is_instance_valid(_shot_in_flight)` return false? Select all that apply.
type: multiple
options:
  - '`null`, before the first shot'
  - A shot that has left the screen and freed itself
  - A shot that is still flying
answer: [0, 1]
```
