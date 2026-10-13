---
title: Rebinding keys
description: Changing the InputMap at runtime, swapping conflicts, and remembering the player's choice.
estimatedMinutes: 25
---

Because the game reads **actions** rather than keys, rebinding only means changing which key an action points to. Not a single line of gameplay code changes.

## InputMap helpers in Settings

`InputMap` is the runtime version of the Input Map tab in Project Settings. Changes made to it last until the game quits, so we also save them, in a `[controls]` section. Add these to `settings.gd`:

```gdscript title="settings.gd" ins={2-4,8-35,44-45,59-62}
const SAVE_PATH := "user://settings.cfg"
const REBINDABLE_ACTIONS: Array[StringName] = [
	&"move_left", &"move_right", &"soft_drop", &"hard_drop", &"rotate_cw", &"rotate_ccw", &"hold",
]

# ...

func get_key(action: StringName) -> Key:
	for event in InputMap.action_get_events(action):
		if event is InputEventKey:
			return event.physical_keycode
	return KEY_NONE


## Bind `keycode` to `action`. An action that already used that key gets
## `action`'s old key instead, so two actions never share a key.
func set_key(action: StringName, keycode: Key) -> void:
	var old_key := get_key(action)
	for other in REBINDABLE_ACTIONS:
		if other != action and get_key(other) == keycode:
			_bind(other, old_key)
	_bind(action, keycode)


func _bind(action: StringName, keycode: Key) -> void:
	InputMap.action_erase_events(action)
	var event := InputEventKey.new()
	event.physical_keycode = keycode
	InputMap.action_add_event(action, event)


func key_name(action: StringName) -> String:
	return OS.get_keycode_string(get_key(action))


func save_settings() -> void:
	var config := ConfigFile.new()
	config.set_value("audio", "master_volume", master_volume)
	config.set_value("audio", "sfx_volume", sfx_volume)
	config.set_value("video", "fullscreen", fullscreen)
	config.set_value("game", "ghost_piece", ghost_piece)
	config.set_value("game", "das_ms", das_ms)
	config.set_value("game", "arr_ms", arr_ms)
	for action in REBINDABLE_ACTIONS:
		config.set_value("controls", action, get_key(action))
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
	for action in REBINDABLE_ACTIONS:
		var keycode: Key = config.get_value("controls", action, KEY_NONE)
		if keycode != KEY_NONE:
			_bind(action, keycode)
```

- **`get_key`** finds the first keyboard event of an action and returns its physical keycode, or `KEY_NONE`.
- **`_bind`** replaces all of an action's events with a single physical key.
- **`set_key`** is the public version, and it handles **conflicts**. If you bind hard drop to <kbd>↑</kbd> while rotate uses <kbd>↑</kbd>, one key would do two things. Instead, rotate gets hard drop's old key (<kbd>Space</kbd>): the two simply swap.
- **`key_name`** turns a keycode into readable text like `Space` or `Up`.
- **Loading uses `_bind`, not `set_key`.** The saved bindings are already conflict-free, and swapping while loading them one by one could scramble them.

Keycodes are plain numbers in the file (`hold=4194325` is <kbd>Shift</kbd>), which is why they're read back as a `Key`.

## Rebinding UI

The seven rows of the controls grid are built from code, so adding an action later is a one-line change. Here's the options script with the additions highlighted:

```gdscript title="options_menu.gd" ins={2-16,24,35,37-70}
extends Control

const ACTION_LABELS := {
	&"move_left": "Move left",
	&"move_right": "Move right",
	&"soft_drop": "Soft drop",
	&"hard_drop": "Hard drop",
	&"rotate_cw": "Rotate right",
	&"rotate_ccw": "Rotate left",
	&"hold": "Hold",
}

## The action waiting for a new key, or &"" when not rebinding.
var _rebinding := &""
## One button per action, so a swap can update both buttons involved.
var _key_buttons := {}

@onready var master_slider: HSlider = %MasterSlider
@onready var sfx_slider: HSlider = %SfxSlider
@onready var fullscreen_check: CheckButton = %FullscreenCheck
@onready var ghost_check: CheckButton = %GhostCheck
@onready var das_spin: SpinBox = %DasSpin
@onready var arr_spin: SpinBox = %ArrSpin
@onready var controls_grid: GridContainer = %ControlsGrid


func _ready() -> void:
	# The *_no_signal setters avoid triggering our change handlers (and the test sound).
	master_slider.set_value_no_signal(Settings.master_volume)
	sfx_slider.set_value_no_signal(Settings.sfx_volume)
	fullscreen_check.set_pressed_no_signal(Settings.fullscreen)
	ghost_check.set_pressed_no_signal(Settings.ghost_piece)
	das_spin.set_value_no_signal(Settings.das_ms)
	arr_spin.set_value_no_signal(Settings.arr_ms)
	_build_controls()
	master_slider.grab_focus()


func _build_controls() -> void:
	for action in Settings.REBINDABLE_ACTIONS:
		var label := Label.new()
		label.text = ACTION_LABELS[action]
		var button := Button.new()
		button.custom_minimum_size.x = 100
		button.pressed.connect(_start_rebind.bind(action))
		controls_grid.add_child(label)
		controls_grid.add_child(button)
		_key_buttons[action] = button
	_update_key_buttons()


func _update_key_buttons() -> void:
	for action in _key_buttons:
		_key_buttons[action].text = Settings.key_name(action)


func _start_rebind(action: StringName) -> void:
	_rebinding = action
	_key_buttons[action].text = "Press a key…"


func _input(event: InputEvent) -> void:
	if _rebinding == &"" or not (event is InputEventKey and event.pressed and not event.echo):
		return
	get_viewport().set_input_as_handled()
	# The pause keys (Esc and P) cancel instead of being bound.
	if not event.is_action(&"pause"):
		Settings.set_key(_rebinding, event.physical_keycode)
	_rebinding = &""
	_update_key_buttons()


# ...the change handlers stay as they were
```

How a rebind plays out:

1. The player presses a key button. `bind(action)` created a callable with the action baked in, so all seven buttons share `_start_rebind`, and each knows which action it's for.
2. The button says "Press a key…" and `_rebinding` remembers the action.
3. The next key press arrives in `_input`, gets marked as handled, and becomes the new binding (or cancels, for <kbd>Esc</kbd> and <kbd>P</kbd>).
4. `_update_key_buttons` refreshes **every** button, since a swap may have changed two of them.

A few details:

- **`_input`, not `_unhandled_input`.** `_input` runs *before* the UI handles the event, so pressing <kbd>Space</kbd> or <kbd>Enter</kbd> gets captured as the new key instead of clicking the focused button again.
- **`echo` events** are key repeats while holding a key; we ignore them.
- **The pause keys can't be bound.** `event.is_action(&"pause")` is true for <kbd>Esc</kbd> and <kbd>P</kbd>, and they cancel instead. Otherwise a player could put hold and pause on the same key.

:::tip[Gamepads]
To support controllers, also accept `InputEventJoypadButton` in `_input` and bind those events too. The structure stays the same; only `get_key` and `_bind` need to know about the new event type.
:::

Open the options, rebind a few keys, go back and play: the new keys work, and they're still there after restarting the game.

```quiz
question: Hold uses C and hard drop uses Space. The player rebinds hold to Space. What happens?
options:
  - Both hold and hard drop now use Space
  - Hold uses Space and hard drop gets C
  - Nothing; Space is already taken
answer: 1
explain: '`set_key` finds that hard drop already uses Space and gives it hold''s old key, C.'
```

```quiz
question: Why does the rebind code listen in `_input` rather than `_unhandled_input`?
options:
  - _unhandled_input doesn't receive keyboard events
  - _input sees the key before UI controls do, so Space or Enter become the new key instead of pressing the button again
  - _input is called less often
answer: 1
```
