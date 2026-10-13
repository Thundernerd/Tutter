---
title: Rebinding keys
description: Changing the InputMap at runtime, for two players, and saving the result.
estimatedMinutes: 25
---

Because the car reads **actions** rather than keys, rebinding only means changing which key an action points to. The car code never changes.

## InputMap helpers

`InputMap` is the runtime version of the Input Map tab in Project Settings. Add these to `settings.gd`:

```gdscript title="settings.gd"
const REBINDABLE_ACTIONS: Array[StringName] = [
	&"p1_accelerate", &"p1_brake", &"p1_left", &"p1_right",
	&"p2_accelerate", &"p2_brake", &"p2_left", &"p2_right",
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

Changes to `InputMap` last until the game quits, so save them too, in a `[controls]` section:

```gdscript title="settings.gd" ins={4-5,12-15}
func save_settings() -> void:
	# ...
	config.set_value("race", "cpu_difficulty", cpu_difficulty)
	for action in REBINDABLE_ACTIONS:
		config.set_value("controls", action, get_key(action))
	config.save(SAVE_PATH)


func load_settings() -> void:
	# ...
	cpu_difficulty = config.get_value("race", "cpu_difficulty", cpu_difficulty)
	for action in REBINDABLE_ACTIONS:
		var keycode: Key = config.get_value("controls", action, KEY_NONE)
		if keycode != KEY_NONE:
			set_key(action, keycode)
```

## A controls table

Two players times four actions is eight buttons. A three-column grid keeps it compact: the action name, then P1's key, then P2's key.

Add a second column to the options layout, next to `SettingsColumn` inside `Columns`:

```text
Controls (VBoxContainer)                 # separation 8
├── ControlsTitle (Label)                # "Controls", size 18
└── ControlsGrid (GridContainer, %)      # columns 3, filled from code
```

The rows are built from code, so the labels and the action names live in one place:

```gdscript title="options_menu.gd"
const PLAYERS: Array[String] = ["p1", "p2"]
## Action name without the player prefix, and the label shown for it.
const CONTROLS := {
	"accelerate": "Accelerate",
	"brake": "Brake / reverse",
	"left": "Steer left",
	"right": "Steer right",
}

## The action waiting for a new key, or &"" when not rebinding.
var _rebinding := &""
var _rebind_button: Button

@onready var controls_grid: GridContainer = %ControlsGrid


func _ready() -> void:
	# ...existing setup...
	_build_controls()
	master_slider.grab_focus()


func _build_controls() -> void:
	for header in ["", "P1", "P2"]:
		var label := Label.new()
		label.text = header
		label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		controls_grid.add_child(label)
	for control in CONTROLS:
		var label := Label.new()
		label.text = CONTROLS[control]
		controls_grid.add_child(label)
		for player in PLAYERS:
			var action := StringName(player + "_" + control)
			var button := Button.new()
			button.text = Settings.key_name(action)
			button.custom_minimum_size.x = 84
			button.pressed.connect(_start_rebind.bind(action, button))
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

- The action name is built the same way the car builds it: prefix + `_` + control. `StringName(...)` converts the string, because actions are StringNames.
- `bind(action, button)` bakes extra arguments into the callable, so all eight buttons share one handler.
- We listen in `_input`, not `_unhandled_input`. `_input` runs **before** the UI handles an event, so pressing <kbd>Space</kbd> or <kbd>Enter</kbd> is captured as the new key instead of pressing the focused button again.
- `echo` events are key repeats from holding a key down. Ignore them.

:::tip[Clashing keys]
Nothing stops both players binding the same key, and with a shared keyboard someone will try. An easy extra: in `_input`, loop over `Settings.REBINDABLE_ACTIONS`, and if another action already uses the key, swap the two bindings.
:::

```quiz
question: Why does the rebind code use `_input` rather than `_unhandled_input`?
options:
  - _unhandled_input doesn't receive keyboard events
  - _input sees the key before the UI does, so keys like Space or Enter are captured instead of re-pressing the button
  - _input is called less often
answer: 1
```

```quiz
type: text
question: Which action name does the button in the "Steer left" row, "P2" column, rebind?
answer: [p2_left, "&\"p2_left\""]
```
