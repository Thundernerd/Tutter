---
title: Rebinding keys
description: Changing the InputMap while the game runs, and remembering the player's choice.
estimatedMinutes: 20
---

This is where using input actions pays off. The snake asks about `move_up`, never about the ↑ key, so rebinding means changing which key `move_up` points to. `snake.gd` doesn't change at all.

## InputMap helpers in Settings

`InputMap` is the code version of the Input Map tab in Project Settings. Add a list of rebindable actions and three helpers to `settings.gd`:

```gdscript title="settings.gd" ins={2}
const SAVE_PATH := "user://settings.cfg"
const REBINDABLE_ACTIONS: Array[StringName] = [&"move_up", &"move_down", &"move_left", &"move_right"]
```

```gdscript title="settings.gd" ins={7-24}
func _set_bus_volume(bus_name: StringName, value: float) -> void:
	var index := AudioServer.get_bus_index(bus_name)
	AudioServer.set_bus_volume_db(index, linear_to_db(value))
	AudioServer.set_bus_mute(index, value <= 0.0)


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


func save_settings() -> void:
```

- `get_key` looks through the events of an action and returns the first keyboard key it finds. `is` checks what type something is. `KEY_NONE` means "no key".
- `set_key` removes all the action's events and adds a single new key. If you gave the move actions a second key (like WASD) in chapter 1, rebinding replaces both.
- `key_name` turns a key code into readable text like `Up` or `W`, for the buttons.

Changes to the `InputMap` only last until the game quits, so save them in a `[controls]` section of the settings file and restore them when loading:

```gdscript title="settings.gd" ins={2-3}
	config.set_value("game", "speed_level", speed_level)
	for action in REBINDABLE_ACTIONS:
		config.set_value("controls", action, get_key(action))
	config.save(SAVE_PATH)
```

```gdscript title="settings.gd" ins={2-5}
	speed_level = clampi(config.get_value("game", "speed_level", speed_level), 0, START_SPEEDS.size() - 1)
	for action in REBINDABLE_ACTIONS:
		var keycode: Key = config.get_value("controls", action, KEY_NONE)
		if keycode != KEY_NONE:
			set_key(action, keycode)
```

## Rebinding UI

The controls grid is filled from code: one label and one button per action. Adding an action later is then a one-line change.

```gdscript title="options_menu.gd" ins={3-13,19,29,33-60}
extends Control

const ACTION_LABELS := {
	&"move_up": "Up",
	&"move_down": "Down",
	&"move_left": "Left",
	&"move_right": "Right",
}

## The action waiting for a new key, or &"" when not rebinding.
var _rebinding := &""
var _rebind_button: Button

@onready var master_slider: HSlider = %MasterSlider
@onready var sfx_slider: HSlider = %SfxSlider
@onready var fullscreen_check: CheckButton = %FullscreenCheck
@onready var wrap_check: CheckButton = %WrapCheck
@onready var speed_option: OptionButton = %SpeedOption
@onready var controls_grid: GridContainer = %ControlsGrid


func _ready() -> void:
	# The *_no_signal setters avoid triggering our change handlers (and the test sound).
	master_slider.set_value_no_signal(Settings.master_volume)
	sfx_slider.set_value_no_signal(Settings.sfx_volume)
	fullscreen_check.set_pressed_no_signal(Settings.fullscreen)
	wrap_check.set_pressed_no_signal(Settings.wrap_around)
	speed_option.selected = Settings.speed_level
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
```

- `Label.new()` and `Button.new()` create nodes from code; `add_child` puts them in the tree. This is exactly what the editor does when you add a node by hand.
- `pressed.connect(...)` connects a signal from code. `_start_rebind.bind(action, button)` is the function with two arguments already filled in, so all four buttons can share one function and it still knows which one was clicked.
- While `_rebinding` holds an action, the next key press becomes its new key. <kbd>Esc</kbd> cancels instead: it's the pause key, so it would make a poor steering key anyway.
- `echo` events are the repeats you get while holding a key down; we ignore those.

:::note[Why `_input` and not `_unhandled_input`?]
`_input` runs **before** the UI gets to see the event. While waiting for a key, pressing <kbd>Space</kbd> or <kbd>Enter</kbd> should become the new key, not click the focused button again. `set_input_as_handled()` then stops the UI from also reacting to it.
:::

Run the game, open Options, and rebind the four directions to WASD. Play a round with them, then restart the game: the options screen still shows W, A, S and D.

```quiz
question: After rebinding `move_up` to W, what has to change in `snake.gd`?
options:
  - The DIRECTIONS dictionary
  - The `_unhandled_input` function
  - Nothing
answer: 2
explain: The snake only knows about the action `move_up`. Which key triggers that action is the InputMap's business.
```

```quiz
question: What does `_start_rebind.bind(action, button)` give to `connect`?
options:
  - The result of calling `_start_rebind` right away
  - A Callable for `_start_rebind` with `action` and `button` filled in, called when the button is pressed
  - A copy of the button
answer: 1
```
