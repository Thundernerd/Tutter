---
title: A Settings autoload
description: Settings that survive scene changes and restarts, saved to user:// with ConfigFile.
estimatedMinutes: 20
---

`Session` holds what you picked for *this* sitting. Settings are different: volume, fullscreen, laps per race and CPU difficulty should still be there next time you launch the game. They get their own autoload, which loads from disk at startup and saves when you leave the options screen.

## Audio buses first

There'll be two volume sliders: master and effects. Open the **Audio** panel at the bottom of the editor, click **Add Bus**, and rename the new bus `SFX`. Godot saves the layout as `default_bus_layout.tres`. Every sound player in the game will output to `SFX`, which feeds into `Master`.

## The script

Create `settings.gd`:

```gdscript title="settings.gd"
extends Node
## Global game settings and lap records. Registered as the "Settings" autoload.

signal changed

const SAVE_PATH := "user://settings.cfg"
## CPU top speed as a fraction of the player's, for easy, normal and hard.
const CPU_SKILL: Array[float] = [0.82, 0.9, 0.97]

var master_volume := 0.8
var sfx_volume := 0.8
var fullscreen := false
var laps := 3
## 0 = easy, 1 = normal, 2 = hard.
var cpu_difficulty := 1


func _ready() -> void:
	load_settings()
	apply()


## Push the current values to the audio server and the window.
func apply() -> void:
	_set_bus_volume(&"Master", master_volume)
	_set_bus_volume(&"SFX", sfx_volume)
	var mode := DisplayServer.WINDOW_MODE_FULLSCREEN if fullscreen else DisplayServer.WINDOW_MODE_WINDOWED
	DisplayServer.window_set_mode(mode)
	changed.emit()


func _set_bus_volume(bus_name: StringName, value: float) -> void:
	var index := AudioServer.get_bus_index(bus_name)
	AudioServer.set_bus_volume_db(index, linear_to_db(value))
	AudioServer.set_bus_mute(index, value <= 0.0)


func cpu_skill() -> float:
	return CPU_SKILL[cpu_difficulty]


func save_settings() -> void:
	var config := ConfigFile.new()
	config.set_value("audio", "master_volume", master_volume)
	config.set_value("audio", "sfx_volume", sfx_volume)
	config.set_value("video", "fullscreen", fullscreen)
	config.set_value("race", "laps", laps)
	config.set_value("race", "cpu_difficulty", cpu_difficulty)
	config.save(SAVE_PATH)


func load_settings() -> void:
	var config := ConfigFile.new()
	if config.load(SAVE_PATH) != OK:
		return # First launch: keep the defaults.
	master_volume = config.get_value("audio", "master_volume", master_volume)
	sfx_volume = config.get_value("audio", "sfx_volume", sfx_volume)
	fullscreen = config.get_value("video", "fullscreen", fullscreen)
	laps = config.get_value("race", "laps", laps)
	cpu_difficulty = config.get_value("race", "cpu_difficulty", cpu_difficulty)
```

Register it in **Project Settings → Globals → Autoload** as `Settings`, and drag it **above** `Session` in the list. Autoloads are created in that order, and later chapters' scripts may look things up in Settings as soon as they start.

### Things worth knowing

- **Volume is logarithmic.** Buses use decibels: 0 dB is full volume, -6 dB about half as loud, and silence is minus infinity. `linear_to_db()` converts a friendly 0–1 slider value. At exactly 0 we mute the bus, since `linear_to_db(0)` is `-inf`.
- **`user://`** is a writable, per-user folder. For this project it's `~/Library/Application Support/Godot/app_userdata/Tiny Racers` on macOS and `%APPDATA%\Godot\app_userdata\Tiny Racers` on Windows (that's why the project's name mattered). `res://` is read-only once the game is exported, so never save there.
- **`ConfigFile`** writes an INI-style file in sections. `get_value`'s third argument is the default, so a settings file from an older version of the game just fills any missing values with defaults.
- The `changed` signal lets any screen react when settings change. Nothing listens to it yet, but it costs nothing to have.

## Use the settings

Replace the two constants in `race.gd`:

```gdscript title="race.gd" ins={7,11,15} del={1-3,6,10,14}
## Top speed of CPU cars, as a fraction of the players'.
const CPU_SKILL := 0.9
const LAPS := 3

# ...
	hud.setup(players, LAPS, head_to_head)
	hud.setup(players, Settings.laps, head_to_head)

# ...
			car.ai = AIDriver.new(car, track, CPU_SKILL)
			car.ai = AIDriver.new(car, track, Settings.cpu_skill())

# ...
	if not head_to_head and car.lap > LAPS:
	if not head_to_head and car.lap > Settings.laps:
```

and the description on the new game screen:

```gdscript title="mode_select.gd" ins={2} del={1}
			description_label.text = "Three laps against %s. %s" % [opponent, info.description]
			description_label.text = "%d laps against %s. %s" % [Settings.laps, opponent, info.description]
```

```quiz
question: Why must settings be saved to `user://` instead of `res://`?
options:
  - user:// is faster
  - res:// is read-only once the game is exported
  - ConfigFile only supports user://
answer: 1
explain: Exported games pack `res://` into a read-only archive. `user://` always points at a writable, per-user folder.
```

```quiz
question: The saved file has no `[race]` section. What does `config.get_value("race", "laps", laps)` return?
options:
  - "null"
  - The current value of `laps`, which is the default 3
  - An error
answer: 1
```
