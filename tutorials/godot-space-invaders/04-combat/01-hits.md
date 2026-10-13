---
title: Collision layers and hits
description: Decide who looks for whom, then let shots ask targets whether they were hit.
estimatedMinutes: 20
---

## Collision layers

Every physics object has a **layer** (what it *is*) and a **mask** (what it *looks for*). Name the layers in **Project Settings → Layer Names → 2D Physics**:

| Layer | Name | Used by |
| --- | --- | --- |
| 1 | `player` | the cannon |
| 2 | `invaders` | every invader |
| 3 | `player_shots` | the player's shot |
| 4 | `invader_shots` | the invaders' shots |
| 5 | `bunkers` | the shields (chapter 5) |
| 6 | `ufo` | the mystery ship (chapter 6) |

In this game only **shots** look for things (plus the bunkers, which watch for invaders marching through them). Targets just exist. That gives this plan:

| Scene | Layer | Mask |
| --- | --- | --- |
| `Player` | `player` | *(none)* |
| `Invader` | `invaders` | *(none)* |
| `PlayerShot` | `player_shots` | `invaders`, `invader_shots`, `bunkers`, `ufo` |
| `InvaderShot` | `invader_shots` | `player`, `bunkers` |
| `Bunker` | `bunkers` | `invaders` |
| `Ufo` | `ufo` | *(none)* |

Set the first three now, in each scene's **Collision** section in the Inspector. The others get theirs when we build them.

:::note[Why the player's shot looks for invader shots]
In the arcade, your shot and an invader's shot can collide and destroy each other. The player's shot has `invader_shots` in its mask, so it sees them. The invader shot doesn't need `player_shots` in its own mask: one side noticing is enough.
:::

## Asking for a hit

When a shot overlaps something, who decides what happens? Not the shot: a shot can't know that an invader explodes, the player loses a life and a bunker loses some pixels. So the shot just *asks*. Every target gets a method with the same name and signature:

```gdscript
func hit(shot: Area2D) -> bool
```

It returns `true` if the target took the hit (the shot should disappear) or `false` if the shot should fly on. That `false` will matter for bunkers: a shot passing through a hole that's already been blasted hasn't hit anything.

Update `shot.gd`:

```gdscript title="shot.gd" ins={9-14,20-24}
extends Area2D
## A shot that flies straight up or down. The player's and the invaders' shots share this script.

## Pixels per second. Negative flies up, positive flies down.
@export var speed := -420.0


func _physics_process(delta: float) -> void:
	# Offer the hit to everything we overlap. A bunker may refuse it:
	# the shot is passing through a hole that was already blasted.
	for area in get_overlapping_areas():
		if area.has_method("hit") and area.hit(self):
			queue_free()
			return
	position.y += speed * delta
	if position.y < -16.0 or position.y > get_viewport_rect().size.y + 16.0:
		queue_free()


## Shots can hit each other: the player's shot destroys an invader shot it touches.
func hit(_shot: Area2D) -> bool:
	set_physics_process(false) # queue_free() waits for the end of the frame; stop hitting things now.
	queue_free()
	return true
```

- `get_overlapping_areas()` lists every area on a layer in our **mask** that overlaps us right now. Physics updates the list once per tick.
- `has_method("hit")` makes the shot work with anything that implements `hit`, whatever its type. This style is called **duck typing**: if it has a `hit` method, it can be hit.
- We check for hits *before* moving. The overlap list was computed at the current position, so the target we're asked about is really where we are.
- A shot is itself a target. When the player's shot hits an invader shot, the invader shot frees itself. `set_physics_process(false)` matters because `queue_free()` only deletes the node at the end of the frame, and until then it could still hit something.

## Invaders take the hit

Add a signal at the top of `invader.gd`:

```gdscript title="invader.gd" ins={5}
class_name Invader
extends Area2D
## One alien in the formation. The formation moves it; it only animates and dies.

signal died(invader: Invader)
```

and the `hit` method at the bottom:

```gdscript title="invader.gd"
## Called by the player's shot.
func hit(_shot: Area2D) -> bool:
	died.emit(self)
	queue_free()
	return true
```

The invader doesn't add score or play sounds. It announces its death, and whoever cares can listen.

## The formation listens

The formation needs to know when an invader dies: to forget it, to speed up, and to notice when the last one is gone. Add two signals of its own:

```gdscript title="formation.gd" ins={4-5}
extends Node2D
## Builds the grid of invaders, marches it across the screen and makes it shoot.

signal invader_killed(invader: Invader)
signal cleared
```

Connect each invader as it's built:

```gdscript title="formation.gd" ins={7}
	for row in ROWS.size():
		for column in COLUMNS:
			var invader: Invader = INVADER_SCENE.instantiate()
			invader.kind = ROWS[row]
			invader.column = column
			invader.position = origin + Vector2(column, row) * SPACING
			invader.died.connect(_on_invader_died)
			add_child(invader)
			_invaders.append(invader)
```

and handle it:

```gdscript title="formation.gd"
func _on_invader_died(invader: Invader) -> void:
	_invaders.erase(invader)
	invader_killed.emit(invader)
	if _invaders.is_empty():
		stop()
		cleared.emit()
	else:
		_update_speed()
```

The formation passes the news on with `invader_killed`, so the game can award points without connecting to 55 invaders itself. `cleared` fires when the wave is over.

Run the game and shoot. Invaders vanish, and the march speeds up with every kill.

```quiz
question: A body overlaps the player's shot, but is on a layer that isn't in the shot's mask. What does `get_overlapping_areas()` return for it?
options:
  - It's in the list, but `hit` returns false
  - It isn't in the list at all
  - It's in the list with a warning
answer: 1
explain: The mask filters what an area detects. Anything on other layers is invisible to it.
```

```quiz
question: Why does an invader emit `died` instead of adding the score itself?
options:
  - Signals are faster than method calls
  - So the invader doesn't need to know about scores, sounds or the HUD; whoever cares connects to the signal
  - Invaders can't access the game script
answer: 1
```
