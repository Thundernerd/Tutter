---
title: A Settings autoload
description: Audio buses, settings that outlive scenes, and saving them with ConfigFile.
estimatedMinutes: 20
---

The options screen changes settings, the game reads them, and they should still be there next time you launch. That's the same problem the high scores had, with the same solution: an autoload that saves to `user://`.

## Audio buses first

We'll have two volume sliders: everything (master) and sound effects. In Godot, sound plays through **audio buses**, chains of volume and effects that feed into each other. Open the **Audio** panel at the bottom of the editor, click **Add Bus**, and rename the new bus `SFX`. Godot saves the layout to `default_bus_layout.tres`. Every sound effect will play on `SFX`, which feeds into `Master`, so the effects slider controls only effects while the master slider controls everything, including music if you add some later.

## The script

Create `settings.gd`:

```gdscript title="settings.gd"
extends Node
## Global game settings. Registered as the "Settings" autoload.

const SAVE_PATH := "user://settings.cfg"

var master_volume := 0.8
var sfx_volume := 0.8
var fullscreen := false
var ghost_piece := true
## Delayed auto shift: how long left or right must be held before the piece slides, in ms.
var das_ms := 170
## Auto repeat rate: the time between steps while sliding, in ms. 0 slides instantly.
var arr_ms := 50


func _ready() -> void:
	load_settings()
	apply()


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
	config.set_value("game", "ghost_piece", ghost_piece)
	config.set_value("game", "das_ms", das_ms)
	config.set_value("game", "arr_ms", arr_ms)
	config.save(SAVE_PATH)


func load_settings() -> void:
	var config := ConfigFile.new()
	if config.load(SAVE_PATH) != OK:
		return # First launch: keep the defaults.
	master_volume = config.get_value("audio", "master_volume", master_volume)
	sfx_volume = config.get_value("audio", "sfx_volume", sfx_volume)
	fullscreen = config.get_value("video", "fullscreen", fullscreen)
	ghost_piece = config.get_value("game", "ghost_piece", ghost_piece)
	das_ms = config.get_value("game", "das_ms", das_ms)
	arr_ms = config.get_value("game", "arr_ms", arr_ms)
```

Register it in **Project Settings → Globals → Autoload** as `Settings`. Autoloads are created in the order they're listed, and nothing in `HighScores` needs `Settings`, so the order doesn't matter here.

### Things worth understanding

- **Volume is logarithmic.** Buses use decibels: 0 dB is full volume, −6 dB sounds roughly half as loud, and silence is minus infinity. `linear_to_db()` converts a friendly 0–1 slider value. At exactly 0 we mute the bus, since `linear_to_db(0)` is `-inf`.
- **Two time units.** `das_ms` and `arr_ms` are whole milliseconds, because that's what the options screen shows. The game converts them to seconds where it uses them.
- **Fallbacks everywhere.** Every `get_value` passes the current value as its default, so a settings file from an older version of the game, with fewer keys, still loads and fills in the rest.

After a visit to the options screen, the saved file looks like this:

```ini title="settings.cfg"
[audio]

master_volume=0.8
sfx_volume=0.5

[video]

fullscreen=false

[game]

ghost_piece=true
das_ms=120
arr_ms=0
```

## Use it in the game

The ghost switch and the auto-repeat timing now come from `Settings`, so the constants from the quality of life chapter go away:

```gdscript title="game.gd" ins={11,21,33,36} del={3-6,20,32,35}
## How many upcoming pieces the HUD shows.
const NEXT_COUNT := 3
## Delayed auto shift: how long left or right must be held before the piece slides, in seconds.
const DAS := 0.17
## Auto repeat rate: the time between steps while sliding, in seconds. 0 slides instantly.
const ARR := 0.05

# ...

func _ready() -> void:
	board.show_ghost = Settings.ghost_piece
	hud.update_stats(score, level, lines)

# ...

func _auto_shift(delta: float) -> void:
	var direction := roundi(Input.get_axis(&"move_left", &"move_right"))
	if direction != _shift_direction:
		_shift_direction = direction
		_shift_timer = DAS
		_shift_timer = Settings.das_ms / 1000.0
		if direction != 0:
			_try_move(Vector2i(direction, 0))
		return
	if direction == 0:
		return
	_shift_timer -= delta
	while _shift_timer <= 0.0:
		if not _try_move(Vector2i(direction, 0)):
			_shift_timer = 0.0 # Against a wall: stay charged, but don't build up moves.
			return
		if ARR <= 0:
		if Settings.arr_ms <= 0:
			continue # An ARR of 0 slides all the way in a single frame.
		_shift_timer += ARR
		_shift_timer += Settings.arr_ms / 1000.0
```

`Settings.das_ms / 1000.0` divides by a float, so the result is a float in seconds, without any integer division surprises.

```quiz
question: What does `linear_to_db(1.0)` return?
type: text
answer: ["0", "0.0", "0 dB", "0db"]
explain: Full volume is 0 dB. Quieter values are negative.
```

```quiz
question: A player saved their settings with an older version of Blockfall that had no ghost option. What happens to `ghost_piece` on load?
options:
  - The game crashes
  - It keeps its default value, true, because get_value falls back to it
  - It becomes null
answer: 1
```
