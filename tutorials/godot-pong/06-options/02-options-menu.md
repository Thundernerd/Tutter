---
title: The options screen
description: Sliders, toggles and dropdowns wired to the Settings autoload.
estimatedMinutes: 20
---

![The options screen with settings on the left and controls on the right](./images/options-menu.png)

## Layout

New scene, `Control` root (Full Rect) named `OptionsMenu`, saved as `options_menu.tscn`. Settings go in a two-column `GridContainer` (labels left, controls right) and the key bindings in a second column next to it:

```text
OptionsMenu (Control, Full Rect)
├── CenterContainer (Full Rect)
│   └── VBoxContainer
│       ├── Title (Label)                      # "Options", size 32
│       ├── Columns (HBoxContainer)            # separation 40
│       │   ├── SettingsGrid (GridContainer)   # columns 2
│       │   │   ├── Label "Master volume"   ├── MasterSlider (HSlider, %)
│       │   │   ├── Label "Effects volume"  ├── SfxSlider (HSlider, %)
│       │   │   ├── Label "Fullscreen"      ├── FullscreenCheck (CheckButton, %)
│       │   │   ├── Label "Points to win"   ├── ScoreSpin (SpinBox, %)
│       │   │   └── Label "Opponent"        └── OpponentOption (OptionButton, %)
│       │   └── Controls (VBoxContainer)
│       │       ├── ControlsTitle (Label)      # "Controls"
│       │       └── ControlsGrid (GridContainer, %)   # columns 2, filled from code
│       └── BackButton (Button)
└── TestSound (AudioStreamPlayer)              # bus: SFX
```

Control settings:

| Node | Properties |
| --- | --- |
| `MasterSlider`, `SfxSlider` | Max Value `1`, Step `0.05`, Custom Minimum Size x `140` |
| `ScoreSpin` | Min `1`, Max `21` |
| `OpponentOption` | Items: "Second player", "CPU" |

A `GridContainer` fills row by row, so add children in label, control, label, control... order.

## The script

Connect each control's change signal to `OptionsMenu`: `value_changed` for sliders and the SpinBox, `toggled` for the CheckButton, `item_selected` for the OptionButton, and `pressed` for Back.

```gdscript title="options_menu.gd"
extends Control

@onready var master_slider: HSlider = %MasterSlider
@onready var sfx_slider: HSlider = %SfxSlider
@onready var fullscreen_check: CheckButton = %FullscreenCheck
@onready var score_spin: SpinBox = %ScoreSpin
@onready var opponent_option: OptionButton = %OpponentOption


func _ready() -> void:
	# The *_no_signal setters avoid triggering our change handlers (and the test sound).
	master_slider.set_value_no_signal(Settings.master_volume)
	sfx_slider.set_value_no_signal(Settings.sfx_volume)
	fullscreen_check.set_pressed_no_signal(Settings.fullscreen)
	score_spin.set_value_no_signal(Settings.winning_score)
	opponent_option.selected = 1 if Settings.vs_cpu else 0
	master_slider.grab_focus()


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


func _on_score_spin_value_changed(value: float) -> void:
	Settings.winning_score = int(value)


func _on_opponent_option_item_selected(index: int) -> void:
	Settings.vs_cpu = index == 1


func _on_back_button_pressed() -> void:
	Settings.save_settings()
	get_tree().change_scene_to_file("res://main_menu.tscn")
```

Changes apply **immediately** (you hear the volume change as you drag), and are **saved** when you leave the screen. Saving on every slider tick would write the file dozens of times per second.

:::warning[The `_no_signal` setters]
Setting `slider.value = x` emits `value_changed` just like dragging does. In `_ready` that would run every handler and play the test sound as soon as the screen opens. `set_value_no_signal` and `set_pressed_no_signal` update the control quietly.
:::

`TestSound` needs a sound to play; we add sound files in the polish chapter. Until then, it plays silence.

```quiz
question: In _ready, why use `set_value_no_signal` instead of assigning `value`?
options:
  - Assigning value is deprecated
  - Assigning value emits value_changed, which would run the handlers and play the test sound
  - set_value_no_signal is faster
answer: 1
```
