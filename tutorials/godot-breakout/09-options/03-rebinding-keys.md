---
title: Rebinding keys
description: Change the InputMap at runtime without losing the mouse button, and save the result.
estimatedMinutes: 20
---

Because the game only ever asks about **actions**, rebinding means changing which key an action points to. The paddle, ball and game scripts don't change at all.

## InputMap helpers

`InputMap` is the runtime version of the Input Map tab in Project Settings. Add these to `settings.gd`:

```gdscript title="settings.gd" ins={2,5-24}
const SAVE_PATH := "user://settings.cfg"
const REBINDABLE_ACTIONS: Array[StringName] = [&"move_left", &"move_right", &"launch"]


## The physical key bound to an action, or KEY_NONE.
func get_key(action: StringName) -> Key:
	for event in InputMap.action_get_events(action):
		if event is InputEventKey:
			return event.physical_keycode
	return KEY_NONE


## Replace the action's key. Other events, like the mouse button on "launch", stay.
func set_key(action: StringName, keycode: Key) -> void:
	for event in InputMap.action_get_events(action):
		if event is InputEventKey:
			InputMap.action_erase_event(action, event)
	var key_event := InputEventKey.new()
	key_event.physical_keycode = keycode
	InputMap.action_add_event(action, key_event)


func key_name(action: StringName) -> String:
	return OS.get_keycode_string(get_key(action))
```

`launch` has two events: <kbd>Space</kbd> and the left mouse button. The easy way to rebind, `InputMap.action_erase_events(action)`, would erase *both*, and after rebinding launch to <kbd>W</kbd>, clicking would no longer launch the ball. So `set_key` only removes the **key** events and leaves everything else alone.

`OS.get_keycode_string` turns a key code into a readable name like `Space` or `Left`.

## Saving the bindings

`InputMap` changes only last until the game quits. Save them as a `[controls]` section, and apply them again on load:

```gdscript title="settings.gd" ins={4-5,12-15}
func save_settings() -> void:
	# ...
	config.set_value("controls", "scheme", control_scheme)
	for action in REBINDABLE_ACTIONS:
		config.set_value("controls", action, get_key(action))
	config.save(SAVE_PATH)


func load_settings() -> void:
	# ...
	control_scheme = config.get_value("controls", "scheme", control_scheme)
	for action in REBINDABLE_ACTIONS:
		var keycode: Key = config.get_value("controls", action, KEY_NONE)
		if keycode != KEY_NONE:
			set_key(action, keycode)
```

Here's a saved file after switching to the keyboard, rebinding left to <kbd>A</kbd> and launch to <kbd>W</kbd>. Key codes are numbers: 65 is A, 87 is W.

```ini title="settings.cfg"
[audio]

master_volume=0.5
sfx_volume=0.25

[video]

fullscreen=false
screen_shake=false

[controls]

scheme=1
move_left=65
move_right=4194321
launch=87
```

## The rebinding UI

The rows in the controls column are built from code, one label and one button per action:

```gdscript title="options_menu.gd" ins={3-12,18,24,26-53}
extends Control

const ACTION_LABELS := {
	&"move_left": "Move left",
	&"move_right": "Move right",
	&"launch": "Launch ball",
}

## The action waiting for a new key, or &"" when not rebinding.
var _rebinding := &""
var _rebind_button: Button

@onready var master_slider: HSlider = %MasterSlider
@onready var sfx_slider: HSlider = %SfxSlider
@onready var fullscreen_check: CheckButton = %FullscreenCheck
@onready var shake_check: CheckButton = %ShakeCheck
@onready var scheme_option: OptionButton = %SchemeOption
@onready var controls_grid: GridContainer = %ControlsGrid


func _ready() -> void:
	# ...
	scheme_option.selected = Settings.control_scheme
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
```

- `bind(action, button)` again: every button shares `_start_rebind`, with its own action and button baked in.
- Clicking a button only *starts* rebinding. The next key press finishes it, in `_input`.
- `_input` runs **before** the UI gets the event. With `_unhandled_input`, pressing <kbd>Space</kbd> would click the focused button again instead of being recorded as the new key.
- `echo` events are the key repeats you get while holding a key down. They're ignored.
- <kbd>Esc</kbd> cancels, so it can't be bound. That keeps the pause key safe.

:::tip[Gamepads]
For controllers, also accept `InputEventJoypadButton` in `_input`, and store `event.button_index` the same way. The structure doesn't change.
:::

```quiz
question: Why does `set_key` remove only InputEventKey events instead of calling `action_erase_events`?
options:
  - action_erase_events is deprecated
  - launch also has a mouse button event, which must survive a key rebind
  - Key events can't be erased all at once
answer: 1
```

```quiz
question: Why is the rebind captured in `_input` instead of `_unhandled_input`?
options:
  - _unhandled_input never receives key events
  - _input sees the key before the UI does, so keys like Space aren't used to press the focused button
  - _input is called less often
answer: 1
```
