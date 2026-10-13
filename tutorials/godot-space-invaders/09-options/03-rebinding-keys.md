---
title: Rebinding keys
description: Change the InputMap at runtime and remember the player's choice.
estimatedMinutes: 20
---

Because the player reads **actions** rather than keys, rebinding only means changing which key an action points to. `player.gd` never changes.

## InputMap helpers in Settings

Add a list of rebindable actions to `settings.gd`:

```gdscript title="settings.gd" ins={2}
const SAVE_PATH := "user://settings.cfg"
const REBINDABLE_ACTIONS: Array[StringName] = [&"move_left", &"move_right", &"shoot"]
```

and three helpers:

```gdscript title="settings.gd"
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

`InputMap` is the runtime version of the Input Map tab in Project Settings. `set_key` replaces whatever the action had with the one new key. Pause isn't in the list: <kbd>Esc</kbd> should always get you out.

Changes to `InputMap` last until the game quits, so we also save them, in a `[controls]` section:

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

The saved file stores key codes as numbers:

```ini title="settings.cfg"
[controls]

move_left=65
move_right=68
shoot=4194325
```

That player moves with <kbd>A</kbd> and <kbd>D</kbd> and fires with <kbd>Shift</kbd>.

## Rebinding UI

The rows of the controls grid are built from code, so adding an action later is a one-line change:

```gdscript title="options_menu.gd"
const ACTION_LABELS := {
	&"move_left": "Move left",
	&"move_right": "Move right",
	&"shoot": "Shoot",
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

Call `_build_controls()` in `_ready` *before* `master_slider.grab_focus()`, and put the `controls_grid` line with the other `@onready` variables.

- `bind(action, button)` creates a callable with extra arguments baked in, so all three buttons share one handler.
- We listen in `_input`, not `_unhandled_input`. `_input` runs *before* the UI handles the event, so pressing <kbd>Space</kbd> or <kbd>Enter</kbd> is captured as the new key instead of clicking the focused button again.
- `echo` events are key-repeat while a key is held; we ignore them.

Rebind **Shoot** to a letter, start a game, and fire with it. Quit and relaunch: the binding is still there.

:::tip[Gamepads]
To support controllers, also accept `InputEventJoypadButton` in `_input` and store `event.button_index`. The structure stays the same.
:::

```quiz
question: Why does the rebind code use `_input` rather than `_unhandled_input`?
options:
  - _unhandled_input doesn't receive keyboard events
  - _input sees the key before UI controls do, so keys like Space or Enter are captured instead of re-pressing the button
  - _input is called less often
answer: 1
```
