---
title: Saving settings
description: Audio buses, applying settings, and a ConfigFile that remembers everything, including the last difficulty.
estimatedMinutes: 20
---

## Audio buses first

We'll have two volume sliders: everything (master) and sound effects. Godot mixes sound through **audio buses**, and each slider will control one.

Open the **Audio** panel at the bottom of the editor, click **Add Bus**, and rename the new bus `SFX`. Godot saves the layout to `default_bus_layout.tres`. Sound players will output to `SFX`, which feeds into `Master`, so the master slider affects everything and the effects slider only the effects.

## The new settings

| Setting | Type | Default |
| --- | --- | --- |
| `master_volume` | float, 0–1 | `0.8` |
| `sfx_volume` | float, 0–1 | `0.8` |
| `fullscreen` | bool | `false` |
| `question_marks` | bool | `false` |

Plus the difficulty and custom board size we already have: the game should remember the last board you played.

## The script

Here's `settings.gd` with the new settings, applying them, and saving them. (The next pages add key bindings on top.)

```gdscript title="settings.gd" ins={4,18-21,24-26,41-46,49-52,55-81}
extends Node
## Global game settings. Registered as the "Settings" autoload.

const SAVE_PATH := "user://settings.cfg"
const PRESETS := {
	"beginner": {"name": "Beginner", "width": 9, "height": 9, "mines": 10},
	"intermediate": {"name": "Intermediate", "width": 16, "height": 16, "mines": 40},
	"expert": {"name": "Expert", "width": 30, "height": 16, "mines": 99},
}
const CUSTOM_MIN_SIZE := Vector2i(5, 5)
const CUSTOM_MAX_SIZE := Vector2i(40, 20)

## A key of PRESETS, or "custom".
var difficulty := "beginner"
var custom_width := 20
var custom_height := 12
var custom_mines := 40
var master_volume := 0.8
var sfx_volume := 0.8
var fullscreen := false
var question_marks := false


func _ready() -> void:
	load_settings()
	apply()


## The size and mine count of the board to play next.
func board_config() -> Dictionary:
	if difficulty == "custom":
		return {"name": "Custom", "width": custom_width, "height": custom_height, "mines": custom_mines}
	return PRESETS[difficulty]


## Leave room for the 3×3 opening around the first click.
func max_mines(width: int, height: int) -> int:
	return width * height - 9


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
	config.set_value("game", "difficulty", difficulty)
	config.set_value("game", "custom_width", custom_width)
	config.set_value("game", "custom_height", custom_height)
	config.set_value("game", "custom_mines", custom_mines)
	config.set_value("game", "question_marks", question_marks)
	config.set_value("audio", "master_volume", master_volume)
	config.set_value("audio", "sfx_volume", sfx_volume)
	config.set_value("video", "fullscreen", fullscreen)
	config.save(SAVE_PATH)


func load_settings() -> void:
	var config := ConfigFile.new()
	if config.load(SAVE_PATH) != OK:
		return # First launch: keep the defaults.
	difficulty = config.get_value("game", "difficulty", difficulty)
	if difficulty != "custom" and not PRESETS.has(difficulty):
		difficulty = "beginner" # A preset from an older version of the game.
	custom_width = clampi(config.get_value("game", "custom_width", custom_width), CUSTOM_MIN_SIZE.x, CUSTOM_MAX_SIZE.x)
	custom_height = clampi(config.get_value("game", "custom_height", custom_height), CUSTOM_MIN_SIZE.y, CUSTOM_MAX_SIZE.y)
	custom_mines = clampi(config.get_value("game", "custom_mines", custom_mines), 1, max_mines(custom_width, custom_height))
	question_marks = config.get_value("game", "question_marks", question_marks)
	master_volume = config.get_value("audio", "master_volume", master_volume)
	sfx_volume = config.get_value("audio", "sfx_volume", sfx_volume)
	fullscreen = config.get_value("video", "fullscreen", fullscreen)
```

### Things worth understanding

- **Volume is logarithmic.** Audio buses use decibels: 0 dB is full volume, -6 dB is roughly half as loud, and silence is minus infinity. `linear_to_db()` converts a friendly 0–1 slider value. At exactly 0 we mute the bus, since `linear_to_db(0)` is `-inf`.
- **`&"Master"`** is a `StringName`, a string Godot interns for fast comparisons. Bus names are StringNames internally.
- **`apply()`** is separate from changing a value, so the options screen can change several values and apply once, and `_ready` can apply everything that was loaded.
- **`get_value`'s third argument** is the fallback. A settings file from an older version of your game simply fills missing values with defaults.

### Never trust a file

`load_settings` doesn't take the file's word for anything that could break the game. Players can edit `settings.cfg` by hand, and future versions of your game might remove a preset:

- An unknown difficulty falls back to `"beginner"`. Without this check, `PRESETS[difficulty]` would crash the game on startup, every time, until the player found and deleted the file.
- The custom size and mine count are clamped to the same limits the difficulty screen enforces, so the `assert` in `place_mines` can never be triggered by a hand-edited file.

The saved file is readable, too:

```ini title="settings.cfg"
[game]

difficulty="expert"
custom_width=20
custom_height=12
custom_mines=40
question_marks=true

[audio]

master_volume=0.8
sfx_volume=0.5

[video]

fullscreen=false
```

## Remember the last difficulty

Save whenever a game is started from the difficulty screen. In `difficulty_menu.gd`:

```gdscript title="difficulty_menu.gd" ins={3}
func _start(difficulty: String) -> void:
	Settings.difficulty = difficulty
	Settings.save_settings()
	get_tree().change_scene_to_file("res://game.tscn")
```

Restart the project after picking expert: the difficulty screen opens with **Expert** focused, so <kbd>Enter</kbd> plays it again.

```quiz
question: Why must settings be saved to `user://` instead of `res://`?
options:
  - user:// is faster
  - res:// is read-only once the game is exported
  - ConfigFile only supports user://
answer: 1
explain: Exported games pack `res://` into a read-only archive. `user://` always points at a writable per-user folder.
```

```quiz
question: What does `linear_to_db(1.0)` return?
type: text
answer: ["0", "0.0", "0 dB", "0db"]
explain: Full volume is 0 dB. Lower values are negative decibels, down to minus infinity for silence.
```

```quiz
question: Someone edits settings.cfg to `difficulty="impossible"`. What happens on the next launch?
options:
  - The game crashes in board_config()
  - load_settings resets it to "beginner"
  - An impossible board is created
answer: 1
explain: The loader checks the value against PRESETS and falls back to a known difficulty.
```
