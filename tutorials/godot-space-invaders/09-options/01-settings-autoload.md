---
title: A Settings autoload
description: Global state that survives scene changes, audio buses, and ConfigFile again.
estimatedMinutes: 20
---

Settings need to outlive scenes: the options menu changes them, the game reads them, and they should be applied the moment the game starts, before any menu opens. Scenes come and go with `change_scene_to_file`, so the settings can't live in one.

## Autoloads

An **autoload** is a script (or scene) Godot creates once at startup and keeps alive alongside every scene. Its name becomes a global variable: anywhere in the project, `Settings.starting_lives` just works.

:::note[Autoload or static class?]
The high score used a `class_name` with static functions, because it only needs loading and saving on demand. Settings must *do* something at startup (set the volume, switch to fullscreen) without anyone asking, so they need a node that runs `_ready()`. That's what an autoload gives you.
:::

## Audio buses first

We'll have two volume sliders: everything, and sound effects. Open the **Audio** panel at the bottom of the editor, click **Add Bus**, and rename the new bus `SFX`. Godot saves the layout to `default_bus_layout.tres`. Every sound player will output to `SFX`, which feeds into `Master`.

## The script

Create `settings.gd` (a script file, not attached to anything):

```gdscript title="settings.gd"
extends Node
## Global game settings. Registered as the "Settings" autoload.

const SAVE_PATH := "user://settings.cfg"

var master_volume := 0.8
var sfx_volume := 0.8
var fullscreen := false
var screen_effects := true
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


func _set_bus_volume(bus_name: StringName, value: float) -> void:
	var index := AudioServer.get_bus_index(bus_name)
	AudioServer.set_bus_volume_db(index, linear_to_db(value))
	AudioServer.set_bus_mute(index, value <= 0.0)


func save_settings() -> void:
	var config := ConfigFile.new()
	config.set_value("audio", "master_volume", master_volume)
	config.set_value("audio", "sfx_volume", sfx_volume)
	config.set_value("video", "fullscreen", fullscreen)
	config.set_value("video", "screen_effects", screen_effects)
	config.set_value("game", "starting_lives", starting_lives)
	config.save(SAVE_PATH)


func load_settings() -> void:
	var config := ConfigFile.new()
	if config.load(SAVE_PATH) != OK:
		return # First launch: keep the defaults.
	master_volume = config.get_value("audio", "master_volume", master_volume)
	sfx_volume = config.get_value("audio", "sfx_volume", sfx_volume)
	fullscreen = config.get_value("video", "fullscreen", fullscreen)
	screen_effects = config.get_value("video", "screen_effects", screen_effects)
	starting_lives = config.get_value("game", "starting_lives", starting_lives)
```

Register it in **Project Settings → Globals → Autoload**: pick `settings.gd`, name it `Settings`, and click **Add**.

### Things worth understanding

- **Volume is logarithmic.** Audio buses use decibels: 0 dB is full volume, -6 dB is roughly half, and silence is minus infinity. `linear_to_db()` converts a friendly 0–1 slider value. At exactly 0 we mute the bus, since `linear_to_db(0)` is `-inf`.
- **Defaults as fallbacks.** Passing the current value as `get_value`'s fallback means a settings file from an older version of your game, missing some keys, simply keeps the defaults for those.
- `screen_effects` lets players turn off the screen shake and red flash we add in the polish chapter. Shaking and flashing screens make some people feel unwell, so an off switch is good manners.

## Use it in the game

```gdscript title="game.gd" ins={2}
func _ready() -> void:
	lives = Settings.starting_lives
	high_score = HighScore.load_best()
```

The `var lives := 3` default stays: it's what the variable holds until `_ready()` runs.

```quiz
question: Why is Settings an autoload rather than a node in the main menu scene?
options:
  - Autoloads run faster
  - It must exist in every scene and apply the saved settings at startup, and scenes are freed when you change them
  - Only autoloads can use ConfigFile
answer: 1
```

```quiz
question: What does `linear_to_db(1.0)` return?
type: text
answer: ["0", "0.0", "0 dB", "0db"]
explain: Full volume is 0 dB; the bus plays at its natural level.
```
