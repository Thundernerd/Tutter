---
title: Spawning the UFO
description: A randomised timer and connecting signals from code.
estimatedMinutes: 10
---

The game scene sends a UFO every 15 to 25 seconds, but only while the formation is still big: when fewer than eight invaders are left, the skies stay clear (another rule from the arcade).

## The timer

Add a `Timer` named `UfoTimer` to `game.tscn`: **Wait Time** `20`, **One Shot** on. Connect its `timeout` to `Game`.

```gdscript title="game.gd" ins={4,6-7,10,16}
extends Node2D

const EXPLOSION_SCENE := preload("res://explosion.tscn")
const UFO_SCENE := preload("res://ufo.tscn")

## The mystery ship only appears while at least this many invaders are left.
const UFO_MIN_INVADERS := 8

@onready var formation: Node2D = $Formation
@onready var ufo_timer: Timer = $UfoTimer


func _ready() -> void:
	formation.build(1)
	formation.start()
	ufo_timer.start()
```

```gdscript title="game.gd"
func _on_ufo_timer_timeout() -> void:
	ufo_timer.start(randf_range(15.0, 25.0))
	if formation.count() < UFO_MIN_INVADERS:
		return
	var ufo: Area2D = UFO_SCENE.instantiate()
	ufo.direction = [-1.0, 1.0].pick_random()
	ufo.position.y = 40
	ufo.destroyed.connect(_on_ufo_destroyed)
	add_child(ufo)


func _on_ufo_destroyed(points: int) -> void:
	print("Mystery ship: ", points)
```

- `ufo_timer.start(seconds)` sets a new wait time and starts the timer in one go. The UFO timer re-arms itself first thing, so the next UFO is scheduled even when this one is skipped.
- The ship flies at y = 40, between the score line and the top row of invaders.
- **Connecting from code.** In the editor you can only connect nodes that already exist. The UFO is created at runtime, so we call `connect` ourselves. When the UFO frees itself, the connection disappears with it.
- `print` is a placeholder: in the next chapter, the bonus goes to the score.

:::tip[Impatient?]
Set **Wait Time** on `UfoTimer` to `2` while testing, so the first UFO appears right away.
:::

Run the game, wait for the saucer, and shoot it down. The Output panel prints its bonus.

```quiz
question: Why must `direction` be set before `add_child(ufo)`?
options:
  - add_child() resets all variables
  - add_child() runs the UFO's `_ready()`, which uses `direction` to pick its starting side
  - Variables can't be changed once a node is in the tree
answer: 1
```
