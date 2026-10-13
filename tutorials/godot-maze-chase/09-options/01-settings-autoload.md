---
title: A Settings autoload
description: Global settings that survive scene changes, applied to the audio buses and the window, and saved with ConfigFile.
estimatedMinutes: 20
---

Settings follow the same pattern as the high score: global state in an autoload, saved to `user://`. The options screen changes them, the game reads them, and they're still there next time.

## Audio buses first

There will be two volume sliders: everything (master) and sound effects. Open the **Audio** panel at the bottom of the editor, click **Add Bus**, and rename the new bus `SFX`. Godot saves the layout to `default_bus_layout.tres`. All the game's sounds will play on `SFX`, which feeds into `Master`.

## The script

Create `settings.gd`:

```gdscript title="settings.gd"
extends Node
## Global game settings. Registered as the "Settings" autoload.

signal changed

const SAVE_PATH := "user://settings.cfg"

var master_volume := 0.8
var sfx_volume := 0.8
var fullscreen := false
var starting_lives := 3


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


func save_settings() -> void:
	var config := ConfigFile.new()
	config.set_value("audio", "master_volume", master_volume)
	config.set_value("audio", "sfx_volume", sfx_volume)
	config.set_value("video", "fullscreen", fullscreen)
	config.set_value("game", "starting_lives", starting_lives)
	config.save(SAVE_PATH)


func load_settings() -> void:
	var config := ConfigFile.new()
	if config.load(SAVE_PATH) != OK:
		return # First launch: keep the defaults.
	master_volume = config.get_value("audio", "master_volume", master_volume)
	sfx_volume = config.get_value("audio", "sfx_volume", sfx_volume)
	fullscreen = config.get_value("video", "fullscreen", fullscreen)
	starting_lives = config.get_value("game", "starting_lives", starting_lives)
```

Register it as an autoload named `Settings`, like `HighScore`.

### Things worth understanding

- **Volume is logarithmic.** Audio buses use decibels: 0 dB is full volume, about -6 dB sounds half as loud, and silence is minus infinity. `linear_to_db()` converts a friendly 0–1 slider value. At exactly 0 we mute the bus, since `linear_to_db(0)` is `-inf`.
- **`apply()`** is separate from loading because the options screen calls it on every change, so you hear the new volume while dragging the slider.
- **`changed`** lets any node react to new settings without the options screen knowing about it. Nothing uses it yet; it's there for things like a "show FPS" option you might add.
- **Defaults as fallbacks**: every `get_value` falls back to the current value. A settings file from an older version of the game, missing a newer setting, still loads fine.

The saved file is readable:

```ini title="settings.cfg"
[audio]

master_volume=0.8
sfx_volume=0.5

[video]

fullscreen=false

[game]

starting_lives=5
```

## Use it in the game

The number of lives now comes from the settings. In `game.gd`'s `_ready`:

```gdscript title="game.gd" ins={2}
func _ready() -> void:
	lives = Settings.starting_lives
	player.ate_pellet.connect(_on_player_ate_pellet)
	hud.update_score(score)
	hud.update_lives(lives)
	_start_round()
```

```quiz
question: Why does `_set_bus_volume` mute the bus when the value is 0?
options:
  - '`linear_to_db(0)` is minus infinity, which is better expressed as mute'
  - Godot can't set a bus to 0 dB
  - Muting is quieter than any volume
answer: 0
```

```quiz
question: A settings.cfg written by an older version of the game has no `starting_lives`. What happens on load?
options:
  - load_settings fails and all settings reset
  - starting_lives keeps its default of 3; the other values load normally
  - The game crashes
answer: 1
```
