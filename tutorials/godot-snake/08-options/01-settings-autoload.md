---
title: A Settings autoload
description: Audio buses, a global Settings script, and moving the game options out of the Inspector.
estimatedMinutes: 20
---

## Audio buses first

There will be two volume sliders: one for everything, one for sound effects. Godot mixes sound through **audio buses**, a bit like the channels on a mixing desk. Every project has a `Master` bus; we add one for effects.

Open the **Audio** panel at the bottom of the editor, click **Add Bus**, and rename the new bus `SFX`. Its output goes to `Master` automatically. Godot saves the layout as `default_bus_layout.tres`. In the polish chapter, every sound effect plays on `SFX`, so its slider controls effects only, while `Master` controls everything.

## The script

Create `settings.gd` the same way as `high_score.gd` (a script on its own, extending `Node`):

```gdscript title="settings.gd"
extends Node
## Global game settings. Registered as the "Settings" autoload.

const SAVE_PATH := "user://settings.cfg"
## Moves per second at the start of a game, for each speed level.
const START_SPEEDS: Array[float] = [5.0, 7.0, 10.0]

var master_volume := 0.8
var sfx_volume := 0.8
var fullscreen := false
var wrap_around := false
## Index into START_SPEEDS: 0 is slow, 1 normal, 2 fast.
var speed_level := 1


func _ready() -> void:
	load_settings()
	apply()


func start_speed() -> float:
	return START_SPEEDS[speed_level]


## Push the current values to the audio server and the window.
func apply() -> void:
	_set_bus_volume(&"Master", master_volume)
	_set_bus_volume(&"SFX", sfx_volume)
	var mode := DisplayServer.WINDOW_MODE_FULLSCREEN if fullscreen else DisplayServer.WINDOW_MODE_WINDOWED
	DisplayServer.window_set_mode(mode)


func _set_bus_volume(bus_name: StringName, value: float) -> void:
	var index := AudioServer.get_bus_index(bus_name)
	AudioServer.set_bus_volume_db(index, linear_to_db(value))
	AudioServer.set_bus_mute(index, value <= 0.0)


func save_settings() -> void:
	var config := ConfigFile.new()
	config.set_value("audio", "master_volume", master_volume)
	config.set_value("audio", "sfx_volume", sfx_volume)
	config.set_value("video", "fullscreen", fullscreen)
	config.set_value("game", "wrap_around", wrap_around)
	config.set_value("game", "speed_level", speed_level)
	config.save(SAVE_PATH)


func load_settings() -> void:
	var config := ConfigFile.new()
	if config.load(SAVE_PATH) != OK:
		return # First launch: keep the defaults.
	master_volume = config.get_value("audio", "master_volume", master_volume)
	sfx_volume = config.get_value("audio", "sfx_volume", sfx_volume)
	fullscreen = config.get_value("video", "fullscreen", fullscreen)
	wrap_around = config.get_value("game", "wrap_around", wrap_around)
	# Clamp, so a hand-edited file can't pick a level that doesn't exist.
	speed_level = clampi(config.get_value("game", "speed_level", speed_level), 0, START_SPEEDS.size() - 1)
```

Register it in **Project Settings → Globals → Autoload** as `Settings`, just like `HighScore`.

### Things worth understanding

- **Settings are loaded and applied at startup.** Autoloads are ready before the first scene, so the game and the menus can rely on `Settings` from their very first line.
- **Volume is logarithmic.** Buses measure volume in decibels: 0 dB is full volume, about -6 dB sounds half as loud, and silence is minus infinity. `linear_to_db()` converts a friendly 0–1 slider value. At exactly 0 we mute the bus, since `linear_to_db(0)` is `-inf`.
- **`DisplayServer`** talks to the operating system's window. `window_set_mode` switches between windowed and fullscreen.
- **Defaults everywhere.** Every `get_value` falls back to the current value, so a settings file from an older version of your game (missing new keys) still loads fine.
- **Never trust a file.** Players can open `settings.cfg` in a text editor. `clampi(value, 0, 2)` forces the speed level between 0 and 2, so `START_SPEEDS[speed_level]` can't crash on a bad index.

The saved file is readable:

```ini title="settings.cfg"
[audio]

master_volume=0.8
sfx_volume=0.5

[video]

fullscreen=false

[game]

wrap_around=true
speed_level=2
```

## Use it in the game

The game's two exported options move into `Settings`. In `game.gd`, delete `START_SPEEDS` and the two `@export` variables, and read `Settings` instead:

```gdscript title="game.gd" del={2-8}
const START_CELL := Vector2i(8, 10)
## Moves per second at the start of a game, for each speed level.
const START_SPEEDS: Array[float] = [5.0, 7.0, 10.0]

## Leave the board on one side to come back on the other, instead of crashing.
@export var wrap_around := false
## Index into START_SPEEDS.
@export_enum("Slow", "Normal", "Fast") var speed_level := 1

var score := 0
```

```gdscript title="game.gd" ins={3} del={2}
func _ready() -> void:
	board.walls_solid = not wrap_around
	board.walls_solid = not Settings.wrap_around
```

```gdscript title="game.gd" ins={3} del={2}
	var head := snake.next_head()
	if wrap_around:
	if Settings.wrap_around:
		head = Board.wrap(head)
```

```gdscript title="game.gd" ins={3} del={2}
func _update_speed() -> void:
	var speed := minf(START_SPEEDS[speed_level] + score * SPEED_STEP, MAX_SPEED)
	var speed := minf(Settings.start_speed() + score * SPEED_STEP, MAX_SPEED)
	move_timer.wait_time = 1.0 / speed
```

The game plays exactly as before (Normal speed, solid walls), but now the values can come from anywhere. Next: a screen to change them.

```quiz
question: A volume slider is at 0.5. Why not set the bus volume to 0.5 directly?
options:
  - Bus volumes are in decibels, a logarithmic scale; linear_to_db converts the slider value
  - Bus volumes only accept whole numbers
  - 0.5 would be too loud
answer: 0
explain: Decibels describe loudness the way ears hear it. `linear_to_db(0.5)` is about -6 dB, which sounds roughly half as loud.
```

```quiz
type: text
question: What does `clampi(7, 0, 2)` return?
answer: ["2"]
explain: '`clampi` keeps a whole number within a range: anything above 2 becomes 2, anything below 0 becomes 0.'
```
