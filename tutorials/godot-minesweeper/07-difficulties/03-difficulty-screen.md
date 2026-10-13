---
title: The difficulty screen
description: Buttons built from data, SpinBoxes for custom boards, and limits that follow each other.
estimatedMinutes: 25
---

## Layout

Create a scene with a `Control` root named `DifficultyMenu` (anchor preset **Full Rect**) and save it as `difficulty_menu.tscn`:

```text
DifficultyMenu (Control, Full Rect)
└── CenterContainer (Full Rect)
    └── VBoxContainer                    # separation 12
        ├── Title (Label)                # "New game", font size 32, centred
        ├── PresetGrid (GridContainer, %) # columns 2, filled from code
        ├── CustomRow (HBoxContainer)    # separation 8
        │   ├── CustomButton (Button)    # "Custom", min width 120
        │   ├── WidthLabel (Label)       # "Width"
        │   ├── WidthSpin (SpinBox, %)
        │   ├── HeightLabel (Label)      # "Height"
        │   ├── HeightSpin (SpinBox, %)
        │   ├── MinesLabel (Label)       # "Mines"
        │   └── MinesSpin (SpinBox, %)   # Min Value 1
        └── BackButton (Button)          # "Back", min width 120, Horizontal: Shrink Center
```

Give `PresetGrid` an **h_separation** of 16 and a **v_separation** of 8 (Theme Overrides → Constants).

A `SpinBox` is a number field with up/down arrows. It inherits from `Range`, like sliders do, so it has `min_value`, `max_value`, `step` and `value`, and it **clamps** its value to the range automatically.

## Rows built from data

The three preset rows aren't in the scene. They're created from `Settings.PRESETS`, so adding a preset there is all it takes to add a row here. **Data drives the UI**: we'll use the same idea again for the list of key bindings in the options chapter.

```gdscript title="difficulty_menu.gd"
extends Control
## Pick a preset or set up a custom board, then start the game.

@onready var preset_grid: GridContainer = %PresetGrid
@onready var width_spin: SpinBox = %WidthSpin
@onready var height_spin: SpinBox = %HeightSpin
@onready var mines_spin: SpinBox = %MinesSpin


func _ready() -> void:
	_build_presets()
	width_spin.min_value = Settings.CUSTOM_MIN_SIZE.x
	width_spin.max_value = Settings.CUSTOM_MAX_SIZE.x
	height_spin.min_value = Settings.CUSTOM_MIN_SIZE.y
	height_spin.max_value = Settings.CUSTOM_MAX_SIZE.y
	width_spin.set_value_no_signal(Settings.custom_width)
	height_spin.set_value_no_signal(Settings.custom_height)
	_update_mine_limit()
	mines_spin.set_value_no_signal(Settings.custom_mines)


func _build_presets() -> void:
	for difficulty in Settings.PRESETS:
		var preset: Dictionary = Settings.PRESETS[difficulty]
		var button := Button.new()
		button.text = preset.name
		button.custom_minimum_size.x = 120
		button.pressed.connect(_start.bind(difficulty))
		var size_label := Label.new()
		size_label.text = "%d × %d, %d mines" % [preset.width, preset.height, preset.mines]
		preset_grid.add_child(button)
		preset_grid.add_child(size_label)
		if difficulty == Settings.difficulty:
			button.grab_focus()


func _update_mine_limit() -> void:
	mines_spin.max_value = Settings.max_mines(int(width_spin.value), int(height_spin.value))


func _on_size_spin_value_changed(_value: float) -> void:
	_update_mine_limit()


func _on_custom_button_pressed() -> void:
	Settings.custom_width = int(width_spin.value)
	Settings.custom_height = int(height_spin.value)
	Settings.custom_mines = int(mines_spin.value)
	_start("custom")


func _start(difficulty: String) -> void:
	Settings.difficulty = difficulty
	get_tree().change_scene_to_file("res://game.tscn")


func _on_back_button_pressed() -> void:
	get_tree().change_scene_to_file("res://main_menu.tscn")
```

Things worth a closer look:

- **`for difficulty in Settings.PRESETS`** loops over the dictionary's *keys*, in the order they were written. `Settings.PRESETS[difficulty]` gets the matching value.
- **`button.pressed.connect(_start.bind(difficulty))`** connects a signal from code. `bind` creates a callable with an extra argument baked in, so all three buttons share one `_start` method, each passing its own key.
- **A `GridContainer` fills row by row**, so adding a button and then a label, three times, gives three rows of two.
- **`grab_focus()`** on the last-played difficulty means <kbd>Enter</kbd> replays it straight away, and arrow keys move between the buttons. Menus should always work from the keyboard.
- **`"%d × %d, %d mines" % [...]`** formats several values at once: each `%d` takes the next integer from the array.

### Limits that follow each other

The largest allowed mine count depends on the board size, so whenever the width or height changes, `_update_mine_limit()` moves the mines spin box's maximum. If the current mine count is now too high, the `SpinBox` clamps it down by itself.

In `_ready`, the order matters: set the width and height first, *then* the mine limit, *then* the mine count. Otherwise a saved count of 300 mines could be clamped by the default limit before the real board size is known.

`set_value_no_signal` sets a value without emitting `value_changed`. In `_ready` we're only showing the stored values, not reacting to the player.

## Connections

Connect the signals in the Node dock:

| Node | Signal | Method |
| --- | --- | --- |
| `CustomButton` | `pressed` | `_on_custom_button_pressed` |
| `WidthSpin` | `value_changed` | `_on_size_spin_value_changed` |
| `HeightSpin` | `value_changed` | `_on_size_spin_value_changed` (same method) |
| `BackButton` | `pressed` | `_on_back_button_pressed` |

Two signals can share one method when they need the same reaction. In the connection dialog, type the existing method's name instead of accepting the suggested one.

## Make it the main scene

Open **Project Settings → Application → Run** and set **Main Scene** to `res://difficulty_menu.tscn`. <kbd>F5</kbd> now starts at the menu; <kbd>F6</kbd> still runs whatever scene is open.

:::warning
`main_menu.tscn` doesn't exist yet, so **Back** prints an error until the next chapter. To pick another difficulty after a game, restart the project for now.
:::

Play a game on each difficulty, and try a few custom boards: a tiny 5×5, a wide 40×10, and the 40×20 maximum.

```quiz
question: What does `_start.bind(difficulty)` produce?
options:
  - It calls _start immediately
  - A callable that calls _start with `difficulty` as its argument when invoked
  - A new signal
answer: 1
explain: '`bind` stores arguments inside the callable. The button''s `pressed` signal has no arguments of its own, so `_start` receives just the bound key.'
```

```quiz
question: The custom board is 10 × 10 with 91 mines. The player lowers the width to 5. What happens to the mine count?
options:
  - It stays at 91 and the game crashes on the first click
  - The new maximum is 41, and the SpinBox clamps the count to 41
  - It resets to 1
answer: 1
explain: 5 × 10 − 9 = 41. Changing max_value on a Range clamps its current value.
```

```quiz
question: In what order does a GridContainer with 2 columns place its children?
options:
  - Column by column
  - Row by row, left to right
  - In a random order
answer: 1
explain: Child 1 and 2 form the first row, 3 and 4 the second, and so on. That's why each preset adds its button, then its label.
```
