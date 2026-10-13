---
title: Rebinding keys
description: Change the InputMap at runtime and remember the player's choice.
estimatedMinutes: 20
---

Because the board reads **actions** rather than keys, rebinding only means changing which key an action points to. The board's code never changes.

## InputMap helpers in Settings

Add these to `settings.gd`. The constant goes with the others at the top, the functions after `_set_bus_volume`:

```gdscript title="settings.gd"
const REBINDABLE_ACTIONS: Array[StringName] = [
	&"cursor_up", &"cursor_down", &"cursor_left", &"cursor_right", &"reveal", &"flag", &"restart",
]


func get_key(action: StringName) -> Key:
	for event in InputMap.action_get_events(action):
		if event is InputEventKey:
			return event.physical_keycode
	return KEY_NONE


func set_key(action: StringName, keycode: Key) -> void:
	InputMap.action_erase_events(action)
	var event := InputEventKey.new()
	event.physical_keycode = keycode
	InputMap.action_add_event(action, event)


func key_name(action: StringName) -> String:
	return OS.get_keycode_string(get_key(action))
```

`pause` isn't in the list on purpose: <kbd>Esc</kbd> is how players expect to get back out of things, and the rebinding screen itself uses <kbd>Esc</kbd> to cancel.

`InputMap` is the runtime version of the Input Map tab in Project Settings. Changes made through it last until the game quits, so we also save them, in a `[controls]` section:

```gdscript title="settings.gd" ins={3-4,9-12}
func save_settings() -> void:
	# ...existing values...
	for action in REBINDABLE_ACTIONS:
		config.set_value("controls", action, get_key(action))
	config.save(SAVE_PATH)

func load_settings() -> void:
	# ...existing values...
	for action in REBINDABLE_ACTIONS:
		var keycode: Key = config.get_value("controls", action, KEY_NONE)
		if keycode != KEY_NONE:
			set_key(action, keycode)
```

Keys are stored as numbers (their keycodes), which is compact and layout-independent, though less readable in the file.

## Rebinding UI

The seven rows of the controls grid are built from code, like the difficulty table, so adding an action later is a one-line change. Add this to `options_menu.gd`:

```gdscript title="options_menu.gd"
const ACTION_LABELS := {
	&"cursor_up": "Cursor up",
	&"cursor_down": "Cursor down",
	&"cursor_left": "Cursor left",
	&"cursor_right": "Cursor right",
	&"reveal": "Reveal",
	&"flag": "Flag",
	&"restart": "Restart",
}

## The action waiting for a new key, or &"" when not rebinding.
var _rebinding := &""
var _rebind_button: Button

@onready var controls_grid: GridContainer = %ControlsGrid


func _ready() -> void:
	# ...existing setup...
	_build_controls()


func _build_controls() -> void:
	for action in Settings.REBINDABLE_ACTIONS:
		var label := Label.new()
		label.text = ACTION_LABELS[action]
		var button := Button.new()
		button.text = Settings.key_name(action)
		button.custom_minimum_size.x = 100
		button.pressed.connect(_start_rebind.bind(action, button))
		controls_grid.add_child(label)
		controls_grid.add_child(button)


func _start_rebind(action: StringName, button: Button) -> void:
	_rebinding = action
	_rebind_button = button
	button.text = "Press a key…"


func _input(event: InputEvent) -> void:
	if _rebinding == &"" or not (event is InputEventKey and event.pressed and not event.echo):
		return
	get_viewport().set_input_as_handled()
	if event.physical_keycode != KEY_ESCAPE: # Escape cancels.
		Settings.set_key(_rebinding, event.physical_keycode)
	_rebind_button.text = Settings.key_name(_rebinding)
	_rebinding = &""
```

- `bind(action, button)` bakes two arguments into the callable, so all seven buttons share one handler.
- We listen in `_input`, not `_unhandled_input`. `_input` runs *before* the UI handles the event, so pressing <kbd>Space</kbd> gets captured as the new key instead of clicking the focused button again.
- `echo` events are key-repeat while holding a key; ignore them.

Here's the complete `options_menu.gd`:

```gdscript title="options_menu.gd"
extends Control

const ACTION_LABELS := {
	&"cursor_up": "Cursor up",
	&"cursor_down": "Cursor down",
	&"cursor_left": "Cursor left",
	&"cursor_right": "Cursor right",
	&"reveal": "Reveal",
	&"flag": "Flag",
	&"restart": "Restart",
}

## The action waiting for a new key, or &"" when not rebinding.
var _rebinding := &""
var _rebind_button: Button

@onready var master_slider: HSlider = %MasterSlider
@onready var sfx_slider: HSlider = %SfxSlider
@onready var fullscreen_check: CheckButton = %FullscreenCheck
@onready var question_check: CheckButton = %QuestionCheck
@onready var controls_grid: GridContainer = %ControlsGrid


func _ready() -> void:
	# The *_no_signal setters avoid triggering our change handlers (and the test sound).
	master_slider.set_value_no_signal(Settings.master_volume)
	sfx_slider.set_value_no_signal(Settings.sfx_volume)
	fullscreen_check.set_pressed_no_signal(Settings.fullscreen)
	question_check.set_pressed_no_signal(Settings.question_marks)
	_build_controls()
	master_slider.grab_focus()


func _build_controls() -> void:
	for action in Settings.REBINDABLE_ACTIONS:
		var label := Label.new()
		label.text = ACTION_LABELS[action]
		var button := Button.new()
		button.text = Settings.key_name(action)
		button.custom_minimum_size.x = 100
		button.pressed.connect(_start_rebind.bind(action, button))
		controls_grid.add_child(label)
		controls_grid.add_child(button)


func _start_rebind(action: StringName, button: Button) -> void:
	_rebinding = action
	_rebind_button = button
	button.text = "Press a key…"


func _input(event: InputEvent) -> void:
	if _rebinding == &"" or not (event is InputEventKey and event.pressed and not event.echo):
		return
	get_viewport().set_input_as_handled()
	if event.physical_keycode != KEY_ESCAPE: # Escape cancels.
		Settings.set_key(_rebinding, event.physical_keycode)
	_rebind_button.text = Settings.key_name(_rebinding)
	_rebinding = &""


func _on_master_slider_value_changed(value: float) -> void:
	Settings.master_volume = value
	Settings.apply()


func _on_sfx_slider_value_changed(value: float) -> void:
	Settings.sfx_volume = value
	Settings.apply()
	$TestSound.play() # Let the player hear the new volume.


func _on_fullscreen_check_toggled(toggled_on: bool) -> void:
	Settings.fullscreen = toggled_on
	Settings.apply()


func _on_question_check_toggled(toggled_on: bool) -> void:
	Settings.question_marks = toggled_on


func _on_back_button_pressed() -> void:
	Settings.save_settings()
	get_tree().change_scene_to_file("res://main_menu.tscn")
```

Rebind **Flag** to <kbd>G</kbd>, go back, start a game: <kbd>G</kbd> flags and <kbd>F</kbd> does nothing. Restart the game: still <kbd>G</kbd>.

:::tip[Conflicts]
Nothing stops a player from binding two actions to the same key; both would fire. A friendlier screen would detect the clash and swap the two bindings. It's a good exercise: before `set_key`, look for another action in `REBINDABLE_ACTIONS` with the same `get_key`.
:::

```quiz
question: Why does the rebind code use `_input` rather than `_unhandled_input`?
options:
  - _unhandled_input doesn't receive keyboard events
  - _input sees the key before UI controls do, so keys like Space or Enter can be captured instead of re-pressing the button
  - _input is called less often
answer: 1
```

```quiz
question: Why does the board not need any changes for rebinding to work?
options:
  - It reads input actions, and only the keys mapped to those actions change
  - It reloads the InputMap every frame
  - Rebinding restarts the game
answer: 0
explain: 'The board asks "was `flag` pressed?", never "was F pressed?". The InputMap answers with whatever key is bound now.'
```

```quiz
question: Which method converts a keycode like `KEY_SPACE` into a readable name?
type: text
answer: [OS.get_keycode_string, get_keycode_string, "OS.get_keycode_string()", "get_keycode_string()"]
explain: '`OS.get_keycode_string(KEY_SPACE)` returns "Space".'
```
