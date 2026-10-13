---
title: Rebinding keys for two players
description: Changing the InputMap at runtime, swapping conflicting keys, and saving the result.
estimatedMinutes: 25
---

Bombers read **actions**, not keys, so rebinding only means changing which key an action points to. `bomber.gd` never changes.

## InputMap helpers in Settings

```gdscript title="settings.gd"
const REBINDABLE_ACTIONS: Array[StringName] = [
	&"p1_up", &"p1_down", &"p1_left", &"p1_right", &"p1_bomb",
	&"p2_up", &"p2_down", &"p2_left", &"p2_right", &"p2_bomb",
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


## Bind a key, swapping with whichever action had it, so no key does two jobs.
func rebind(action: StringName, keycode: Key) -> void:
	var old_key := get_key(action)
	for other in REBINDABLE_ACTIONS:
		if other != action and get_key(other) == keycode:
			set_key(other, old_key)
	set_key(action, keycode)


func key_name(action: StringName) -> String:
	return OS.get_keycode_string(get_key(action))
```

- `InputMap` is the runtime version of the Input Map tab in Project Settings. `action_get_events` lists what's bound to an action; we only care about the first keyboard event.
- `set_key` replaces *all* of an action's events with one physical key.
- **`rebind`** handles conflicts. Two players share one keyboard, and if P2 takes <kbd>W</kbd> while P1 still has it, pressing <kbd>W</kbd> would move both. So whichever action had the key gets *your* old key in exchange: a swap, never a duplicate.
- `&"p1_up"` is a **StringName**, the type Godot uses for action names. It's interned, so comparisons are fast.

Changes to the `InputMap` last until the game quits, so save them in a `[controls]` section:

```gdscript title="settings.gd" ins={3-4,10-13}
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

## The controls grid

`ControlsGrid` has three columns: the action, P1's key, P2's key. A header row, then one row per control. Built from code, so adding an action later is a one-line change:

```gdscript title="options_menu.gd" ins={3-14,18,23}
extends Control

## Row labels for the controls grid. Each row has a P1 and a P2 button.
const ACTION_LABELS := {
	&"up": "Up",
	&"down": "Down",
	&"left": "Left",
	&"right": "Right",
	&"bomb": "Bomb",
}

## The action waiting for a new key, or &"" when not rebinding.
var _rebinding := &""
var _key_buttons: Dictionary[StringName, Button] = {}

# ...
@onready var sudden_death_check: CheckButton = %SuddenDeathCheck
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
	for suffix in ACTION_LABELS:
		var label := Label.new()
		label.text = ACTION_LABELS[suffix]
		controls_grid.add_child(label)
		for player in ["p1", "p2"]:
			var action := StringName(player + "_" + suffix)
			var button := Button.new()
			button.custom_minimum_size.x = 76
			button.pressed.connect(_start_rebind.bind(action))
			controls_grid.add_child(button)
			_key_buttons[action] = button
	_refresh_keys()


func _refresh_keys() -> void:
	for action in _key_buttons:
		_key_buttons[action].text = Settings.key_name(action)


func _start_rebind(action: StringName) -> void:
	_rebinding = action
	_key_buttons[action].text = "Press a key…"


func _input(event: InputEvent) -> void:
	if _rebinding == &"" or not (event is InputEventKey and event.pressed and not event.echo):
		return
	get_viewport().set_input_as_handled()
	if event.physical_keycode != KEY_ESCAPE: # Escape cancels.
		Settings.rebind(_rebinding, event.physical_keycode)
	_rebinding = &""
	_refresh_keys() # A swap may have changed another button too.
```

- `_key_buttons` remembers the button for each action, so `_refresh_keys` can relabel all ten at once. That matters after a swap, when a *different* button's key changed too.
- **`bind(action)`** bakes an argument into a Callable: all ten buttons share `_start_rebind`, each with its own action.
- We listen in **`_input`**, not `_unhandled_input`. `_input` runs *before* the UI handles an event, so pressing <kbd>Space</kbd> or <kbd>Enter</kbd> is captured as the new key instead of re-pressing the focused button.
- `echo` events are key repeat from holding a key down; we ignore them.
- <kbd>Esc</kbd> cancels, which also means Esc itself can't be bound. It's the pause key anyway.

:::tip[Gamepads]
To support controllers, also accept `InputEventJoypadButton` in `_input`, and store `event.button_index` alongside the key. The structure stays the same; `get_key` and `set_key` would just look at a second event type.
:::

Try it: give P2 <kbd>W</kbd> for "up" and watch P1's "up" change to P2's old key. Go back, quit, restart: the bindings are still there.

```quiz
question: P1's bomb is Space and P2's bomb is Enter. You rebind P1's bomb to Enter. What are the two bomb keys afterwards?
options:
  - P1 Enter, P2 Enter
  - P1 Enter, P2 Space
  - P1 Space, P2 Enter (the rebind is refused)
answer: 1
explain: '`rebind` gives P2''s bomb action P1''s old key, Space, so no key is bound twice.'
```

```quiz
question: Why does the rebinding code use `_input` rather than `_unhandled_input`?
options:
  - _unhandled_input doesn't receive keyboard events
  - _input sees the key before UI controls do, so keys like Space or Enter are captured instead of pressing the focused button again
  - _input is called less often
answer: 1
```

## Checkpoint

Everything a player can configure is configurable, and remembered. One chapter of polish to go.
