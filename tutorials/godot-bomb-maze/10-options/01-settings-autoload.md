---
title: A Settings autoload
description: Volume, window and game settings in one global node, saved to user:// with ConfigFile.
estimatedMinutes: 20
---

Settings have the same problem as the match score: the options screen changes them, the game reads them, and scenes come and go in between. They also need to survive *quitting the game*, so this autoload saves to disk.

## Audio buses

We'll have two volume sliders: everything, and sound effects. Open the **Audio** panel at the bottom of the editor, click **Add Bus**, and rename the new bus `SFX`. Godot saves the layout to `default_bus_layout.tres`. Sound players will output to `SFX`, which feeds into `Master`.

## The script

Create `settings.gd`:

```gdscript title="settings.gd"
extends Node
## Global game settings. Registered as the "Settings" autoload.

const SAVE_PATH := "user://settings.cfg"
const DIFFICULTY_NAMES: Array[String] = ["Easy", "Normal", "Hard"]

var master_volume := 0.8
var sfx_volume := 0.8
var fullscreen := false
var rounds_to_win := 3
## 0 easy, 1 normal, 2 hard. An index into CpuBrain.LEVELS.
var cpu_difficulty := 1
var sudden_death := true
var monsters := true


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
	config.set_value("game", "rounds_to_win", rounds_to_win)
	config.set_value("game", "cpu_difficulty", cpu_difficulty)
	config.set_value("game", "sudden_death", sudden_death)
	config.set_value("game", "monsters", monsters)
	config.save(SAVE_PATH)


func load_settings() -> void:
	var config := ConfigFile.new()
	if config.load(SAVE_PATH) != OK:
		return # First launch: keep the defaults.
	master_volume = config.get_value("audio", "master_volume", master_volume)
	sfx_volume = config.get_value("audio", "sfx_volume", sfx_volume)
	fullscreen = config.get_value("video", "fullscreen", fullscreen)
	rounds_to_win = config.get_value("game", "rounds_to_win", rounds_to_win)
	cpu_difficulty = config.get_value("game", "cpu_difficulty", cpu_difficulty)
	sudden_death = config.get_value("game", "sudden_death", sudden_death)
	monsters = config.get_value("game", "monsters", monsters)
```

Register it in **Project Settings → Globals → Autoload** as `Settings`, and drag it above `Match` in the list. Autoloads are created top to bottom, so anything that needs settings early finds them ready.

### Things worth understanding

- **Volume is logarithmic.** Buses use decibels: 0 dB is full volume, −6 dB roughly half as loud, and silence is minus infinity. `linear_to_db()` converts a friendly 0–1 slider value. At exactly 0 we mute the bus, since `linear_to_db(0)` is `-inf`.
- **`user://`** is a writable per-user folder: `%APPDATA%\Godot\app_userdata\Blast Grid` on Windows, `~/Library/Application Support/Godot/app_userdata/Blast Grid` on macOS, `~/.local/share/godot/app_userdata/Blast Grid` on Linux. `res://` is the project itself and is read-only in exported games, so never save there.
- **`ConfigFile`** writes an INI-style file with sections. `get_value`'s third argument is the fallback, so a settings file from an older version of your game (without, say, `monsters`) just fills the gaps with defaults.

The saved file is readable, and handy when debugging:

```ini title="settings.cfg"
[audio]

master_volume=0.8
sfx_volume=0.5

[video]

fullscreen=false

[game]

rounds_to_win=5
cpu_difficulty=2
sudden_death=true
monsters=false
```

```quiz
question: Why does `_set_bus_volume` mute the bus when the value is 0 instead of just setting the decibels?
options:
  - Muting is faster
  - linear_to_db(0) is minus infinity, which isn't a useful volume to set
  - ConfigFile can't store 0
answer: 1
```

```quiz
question: Your game saves to `res://settings.cfg`. It works in the editor. What happens in the exported game?
options:
  - It works the same
  - Saving fails, because res:// is packed into a read-only file in exports
  - The file is saved next to the executable
answer: 1
```
