---
title: Waves
description: A new, lower formation after each cleared wave, and fresh bunkers.
estimatedMinutes: 15
---

Clear the screen and another formation appears, one step lower than the last, with the bunkers rebuilt. The game never really ends until you lose.

## Starting a wave

Add another `Timer` to `game.tscn`, named `WaveTimer`: **Wait Time** `2`, **One Shot** on. It's the breather between waves.

```gdscript title="game.gd" ins={3}
var score := 0
var lives := 3
var wave := 1
var _extra_life_awarded := false
```

Add the timer reference next to the others:

```gdscript title="game.gd" ins={4}
@onready var player: Area2D = $Player
@onready var formation: Node2D = $Formation
@onready var hud: CanvasLayer = $HUD
@onready var wave_timer: Timer = $WaveTimer
@onready var respawn_timer: Timer = $RespawnTimer
@onready var ufo_timer: Timer = $UfoTimer
```

`_ready` hands over to a new function:

```gdscript title="game.gd" ins={7,10-17} del={4-6}
func _ready() -> void:
	hud.set_score(score)
	hud.set_lives(lives)
	formation.build(1)
	formation.start()
	ufo_timer.start()
	_start_wave()


func _start_wave() -> void:
	formation.build(wave)
	get_tree().call_group("bunkers", "reset")
	hud.set_wave(wave)
	wave_timer.start()
	await wave_timer.timeout
	formation.start()
	ufo_timer.start()
```

- `formation.build(wave)` finally passes a real wave number: wave 2 starts 12 pixels lower, wave 3 at 24, up to six drops (72 pixels) from wave 7 on.
- `call_group("bunkers", "reset")` restores every bunker. That's why we put them in a group in chapter 5.
- The formation is built at once but only starts marching (and firing) after the two-second wait, so you get a moment to get ready.

## Clearing a wave

Connect the formation's `cleared` signal to `Game`:

```gdscript title="game.gd"
func _on_formation_cleared() -> void:
	ufo_timer.stop()
	_clear_shots()
	wave_timer.start()
	await wave_timer.timeout
	wave += 1
	_start_wave()
```

A short pause after the last invader explodes, then the next wave. The formation stopped its own timers when it emitted `cleared`, so nothing marches or fires in between.

:::note[Why later waves start lower]
A lower start means fewer drops before the invaders reach the bunkers and your cannon. It's the arcade's way of making each wave harder without changing any speeds.
:::

```quiz
question: On which wave does the formation first start 72 pixels below wave 1?
type: text
answer: ["7", "seven", "wave 7"]
hint: The drop is `DROP * mini(wave - 1, 6)` with DROP = 12.
explain: 72 / 12 = 6 drops, so wave − 1 = 6. Every wave after that starts at the same height.
```
