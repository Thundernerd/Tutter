---
title: A Settings autoload
description: Global state that survives scene changes, saved with ConfigFile.
estimatedMinutes: 20
---

Settings need to outlive scenes: the options menu changes them, the game reads them, and they should still be there next time you launch. Scenes come and go with `change_scene_to_file`, so the settings can't live in one.

## Autoloads

An **autoload** is a script (or scene) Godot creates once at startup and keeps alive alongside every scene. Its name becomes a global variable: anywhere in the project, `Settings.vs_cpu` just works.

## Audio buses first

We'll have two volume sliders: master and effects. Open the **Audio** panel at the bottom of the editor, click **Add Bus**, and rename the new bus `SFX`. Godot saves the layout to `default_bus_layout.tres`. Sound players will output to `SFX`, which feeds into `Master`.

## The script

Create `settings.gd` (a script file, not attached to anything):

```gdscript title="settings.gd"
extends Node
## Global game settings. Registered as the "Settings" autoload.

signal changed

const SAVE_PATH := "user://settings.cfg"

var master_volume := 0.8
var sfx_volume := 0.8
var fullscreen := false
var winning_score := 5
var vs_cpu := false


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
	config.set_value("game", "winning_score", winning_score)
	config.set_value("game", "vs_cpu", vs_cpu)
	config.save(SAVE_PATH)


func load_settings() -> void:
	var config := ConfigFile.new()
	if config.load(SAVE_PATH) != OK:
		return # First launch: keep the defaults.
	master_volume = config.get_value("audio", "master_volume", master_volume)
	sfx_volume = config.get_value("audio", "sfx_volume", sfx_volume)
	fullscreen = config.get_value("video", "fullscreen", fullscreen)
	winning_score = config.get_value("game", "winning_score", winning_score)
	vs_cpu = config.get_value("game", "vs_cpu", vs_cpu)
```

Register it in **Project Settings → Globals → Autoload**: pick `settings.gd`, name it `Settings`, and click **Add**.

### Things worth understanding

- **Volume is logarithmic.** Audio buses use decibels: 0 dB is full volume, -6 dB is roughly half as loud, and silence is minus infinity. `linear_to_db()` converts a friendly 0–1 slider value. At exactly 0 we mute the bus, since `linear_to_db(0)` is `-inf`.
- **`user://`** is a per-user, writable folder (`%APPDATA%\Godot\app_userdata\Pong` on Windows, `~/Library/Application Support/Godot/app_userdata/Pong` on macOS). `res://` is your project folder, which is read-only in exported games, so never save there.
- **`ConfigFile`** writes an INI-style file with sections. `get_value`'s third argument is the fallback, so a settings file from an older version of your game simply fills missing values with defaults.

The saved file is human-readable:

```ini title="settings.cfg"
[audio]

master_volume=0.8
sfx_volume=0.5

[game]

winning_score=7
vs_cpu=true
```

## Use it in the game

Replace the constant from the previous chapter:

```gdscript title="game.gd" del={1} ins={5}
const WINNING_SCORE := 5

func _score(player: int) -> void:
	# ...
	if scores[player] >= Settings.winning_score:
```

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
question: What does `config.get_value("game", "vs_cpu", false)` return if the file has no `[game]` section?
type: text
answer: ["false"]
explain: The third argument is the default returned when the section or key is missing.
```
