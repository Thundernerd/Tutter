---
title: Wiring settings into the game
description: Rounds to win, sudden death, monsters and CPU difficulty, each read where it's needed.
estimatedMinutes: 15
---

Four settings change how a match plays. Each one is read in exactly one place.

## Rounds to win

The constant in `match.gd` goes away:

```gdscript title="match.gd" del={1,6} ins={7}
const ROUNDS_TO_WIN := 3

## The index of whoever has won the match, or -1 if it isn't over yet.
func match_winner() -> int:
	for i in wins.size():
		if wins[i] >= ROUNDS_TO_WIN:
		if wins[i] >= Settings.rounds_to_win:
			return i
	return -1
```

and the match results hint follows suit:

```gdscript title="results.gd" del={1} ins={2}
	hint.text = "First to %d wins" % Match.ROUNDS_TO_WIN
	hint.text = "First to %d wins" % Settings.rounds_to_win
```

## Sudden death

When it's off, a time-out is a draw again:

```gdscript title="game.gd" ins={2-4}
func _on_round_timer_timeout() -> void:
	if not Settings.sudden_death:
		_end_round(-1) # Time's up: nobody wins.
		return
	hud.show_hurry()
	_closing_cells = arena.spiral_cells()
	sudden_death_timer.start()
```

## Monsters

Monsters become a choice you make when picking a mode. In `game.gd`:

```gdscript title="game.gd" ins={4-5}
func _ready() -> void:
	arena.generate()
	_spawn_bombers()
	if Settings.monsters:
		_spawn_monsters()
```

and on the mode select screen, add a `CheckButton` named `MonstersCheck` (unique name, text "Monsters") between the mode buttons and Back, and connect its `toggled` signal:

```gdscript title="mode_select.gd" ins={4,8}
extends Control

@onready var vs_cpu_button: Button = %VsCpuButton
@onready var monsters_check: CheckButton = %MonstersCheck


func _ready() -> void:
	monsters_check.set_pressed_no_signal(Settings.monsters)
	vs_cpu_button.grab_focus()


func _on_monsters_check_toggled(toggled_on: bool) -> void:
	Settings.monsters = toggled_on
	Settings.save_settings()
```

The mode select saves right away, since there's no "Back to save" step on this screen.

## CPU difficulty

Each difficulty level is a set of values for the brain's three knobs:

```gdscript title="cpu_brain.gd"
## Settings per difficulty: easy, normal, hard.
const LEVELS := [
	{think_interval = 0.5, aggression = 0.3, hunts_rivals = false},
	{think_interval = 0.25, aggression = 0.6, hunts_rivals = true},
	{think_interval = 0.1, aggression = 0.9, hunts_rivals = true},
]


func set_level(level: int) -> void:
	var settings: Dictionary = LEVELS[level]
	think_interval = settings.think_interval
	aggression = settings.aggression
	hunts_rivals = settings.hunts_rivals
```

| Level | Thinks every | Takes a bombing chance | Hunts rivals |
| --- | --- | --- | --- |
| Easy | 0.5 s | 30% | no, only blocks |
| Normal | 0.25 s | 60% | yes |
| Hard | 0.1 s | 90% | yes |

The easy CPU isn't stupid, it's *slow*: it still never drops a bomb without an escape, but it notices other bombs late and sometimes too late. That's what makes it beatable without looking broken.

The game applies the level when it creates the brain:

```gdscript title="game.gd" ins={3-5}
		if info.controls == "":
			bomber.is_cpu = true
			var brain := CpuBrain.new()
			bomber.add_child(brain)
			brain.set_level(Settings.cpu_difficulty)
		else:
			bomber.controls = info.controls
```

```quiz
question: Why is the easy CPU slow to think rather than careless about escaping?
options:
  - Careless CPUs blow themselves up constantly, which looks broken; slow ones still play sensibly but react late enough to be beaten
  - Slow thinking uses less CPU time
  - The escape search can't be switched off
answer: 0
```
