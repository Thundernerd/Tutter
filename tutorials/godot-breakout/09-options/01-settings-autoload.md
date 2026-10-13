---
title: A Settings autoload
description: Global settings that outlive scenes, audio buses, and a control scheme enum.
estimatedMinutes: 20
---

Settings are changed in the options screen, read by the game, and must still be there the next time you launch. Every scene gets thrown away by `change_scene_to_file`, so the settings need a home that isn't a scene.

## Autoloads

An **autoload** is a script (or scene) that Godot creates once, at startup, and keeps alive next to whatever scene is running. Its name becomes a global: anywhere in the project, `Settings.screen_shake` just works.

## Audio buses

There will be two volume sliders: everything, and sound effects. Open the **Audio** panel at the bottom of the editor, click **Add Bus**, and name the new bus `SFX`. It feeds into `Master`, so turning down Master turns down effects as well. Godot saves the bus layout as `default_bus_layout.tres`.

## The script

Create `settings.gd` (not attached to any node):

```gdscript title="settings.gd"
extends Node
## Global game settings. Registered as the "Settings" autoload.

enum ControlScheme { MOUSE, KEYBOARD }

const SAVE_PATH := "user://settings.cfg"

var master_volume := 0.8
var sfx_volume := 0.8
var fullscreen := false
var screen_shake := true
var control_scheme := ControlScheme.MOUSE


func _ready() -> void:
	load_settings()
	apply()


## Push the current values to the audio server and the window.
func apply() -> void:
	_set_bus_volume(&"Master", master_volume)
	_set_bus_volume(&"SFX", sfx_volume)
	var mode := DisplayServer.WINDOW_MODE_FULLSCREEN if fullscreen else DisplayServer.WINDOW_MODE_WINDOWED
	if DisplayServer.window_get_mode() != mode:
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
	config.set_value("video", "screen_shake", screen_shake)
	config.set_value("controls", "scheme", control_scheme)
	config.save(SAVE_PATH)


func load_settings() -> void:
	var config := ConfigFile.new()
	if config.load(SAVE_PATH) != OK:
		return # First launch: keep the defaults.
	master_volume = config.get_value("audio", "master_volume", master_volume)
	sfx_volume = config.get_value("audio", "sfx_volume", sfx_volume)
	fullscreen = config.get_value("video", "fullscreen", fullscreen)
	screen_shake = config.get_value("video", "screen_shake", screen_shake)
	control_scheme = config.get_value("controls", "scheme", control_scheme)
```

Register it under **Project Settings → Globals → Autoload**: choose `settings.gd`, name it `Settings`, click **Add**.

### Worth knowing

- **Volume is in decibels.** 0 dB is full volume, every -6 dB roughly halves it, and silence is minus infinity. `linear_to_db()` turns a friendly 0–1 slider value into decibels. `linear_to_db(0)` is `-inf`, so at 0 we mute the bus instead.
- **Fullscreen is only changed when it differs.** Sliders call `apply()` many times per second while you drag, and there's no reason to touch the window every time.
- **Default values double as fallbacks.** `get_value(..., master_volume)` returns the current value when the key is missing, so a settings file from an older version of your game just keeps the defaults for anything new.
- **The enum is stored as a number.** `control_scheme` is saved as `0` or `1`. That's why the order in `enum ControlScheme { MOUSE, KEYBOARD }` must not change once players have settings files.

## Mouse or keyboard

The paddle's `use_mouse` export becomes the setting:

```gdscript title="paddle.gd" ins={7} del={2-3,6}
@export var speed := 420.0
## Follow the mouse instead of the keyboard. This becomes a setting in the options chapter.
@export var use_mouse := true

func _physics_process(delta: float) -> void:
	if use_mouse:
	if Settings.control_scheme == Settings.ControlScheme.MOUSE:
```

## Hiding the cursor

With the mouse in control, the pointer sitting on top of the paddle is a distraction. But every screen that pauses the game (pause menu, level complete, game over) has buttons to click, so the cursor must come back whenever the game is paused.

Godot sends every pausable node a **notification** when the game pauses and unpauses. The game can listen for those, instead of every menu having to remember to show and hide the cursor:

```gdscript title="game.gd" ins={5,8-20}
func _ready() -> void:
	best = HighScore.load_best()
	hud.update_score(score, best)
	hud.update_lives(lives)
	_update_cursor()
	_start_level(0)

func _notification(what: int) -> void:
	if what == NOTIFICATION_PAUSED or what == NOTIFICATION_UNPAUSED:
		_update_cursor()


func _exit_tree() -> void:
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE


## Hide the cursor while playing with the mouse. Paused screens need it back.
func _update_cursor() -> void:
	var hide_cursor := Settings.control_scheme == Settings.ControlScheme.MOUSE and not get_tree().paused
	Input.mouse_mode = Input.MOUSE_MODE_HIDDEN if hide_cursor else Input.MOUSE_MODE_VISIBLE
```

- `_notification` receives all of a node's notifications as numbers; we only care about two of them.
- `_exit_tree` runs when the game scene is removed, for instance when you go back to the main menu, so the menu never starts with an invisible cursor.

```quiz
question: Why does the Settings script need to be an autoload?
options:
  - Autoloads run faster
  - It must survive scene changes, and be reachable from every scene
  - ConfigFile only works in autoloads
answer: 1
```

```quiz
question: What does `linear_to_db(1.0)` return?
type: text
answer: ["0", "0.0", "0 dB", "0db"]
explain: 0 dB means "no change", which is full volume for a bus.
```
