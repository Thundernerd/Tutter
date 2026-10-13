---
title: Game over screen
description: A result screen, and switching off input when the game ends.
estimatedMinutes: 15
---

Restarting automatically after a crash was fine for testing, but players want a moment to see their score, and a choice: again, or back to the menu.

## The scene

The game over screen is built just like the pause menu: a `CanvasLayer` named `GameOver` with **Layer** `10`, a dim background and a centred stack. It keeps the default process mode; the game won't be paused while it shows. Save it as `game_over.tscn`.

```text
GameOver (CanvasLayer, layer 10)
├── Dim (ColorRect, Full Rect)      # black at 60% opacity
└── CenterContainer (Full Rect)
    └── VBoxContainer               # min size 200×0, separation 12
        ├── Title (Label)           # "Game over", font size 36
        ├── ScoreLabel (Label)      # unique name, font size 20
        ├── PlayAgainButton (Button)  # unique name
        └── MainMenuButton (Button)
```

Center the two labels horizontally. Attach `game_over.gd` and connect the buttons:

```gdscript title="game_over.gd"
extends CanvasLayer

@onready var score_label: Label = %ScoreLabel
@onready var play_again_button: Button = %PlayAgainButton


func _ready() -> void:
	hide()


func show_result(score: int) -> void:
	score_label.text = "Score: %d" % score
	show()
	play_again_button.grab_focus()


func _on_play_again_button_pressed() -> void:
	get_tree().reload_current_scene()


func _on_main_menu_button_pressed() -> void:
	get_tree().change_scene_to_file("res://main_menu.tscn")
```

**Play again** reloads the game scene, the same trick as before: a fresh scene means a fresh snake, food and score.

## Ending the game properly

Instance `game_over.tscn` in `game.tscn`. Then, in `game.gd`, look up the two menus and change `_game_over`:

```gdscript title="game.gd" ins={2-3}
@onready var hud: CanvasLayer = $HUD
@onready var pause_menu: CanvasLayer = $PauseMenu
@onready var game_over: CanvasLayer = $GameOver
```

```gdscript title="game.gd" ins={4-5,8} del={3,7}
func _game_over() -> void:
	move_timer.stop()
	# For now, start again after a second. Chapter 7 adds a game over screen.
	snake.set_process_unhandled_input(false)
	pause_menu.set_process_unhandled_input(false)
	await get_tree().create_timer(1.0).timeout
	get_tree().reload_current_scene()
	game_over.show_result(score)
```

`set_process_unhandled_input(false)` switches off a node's `_unhandled_input`:

- The **snake** stops listening to the arrow keys. The game is over; turns shouldn't be queued any more.
- The **pause menu** stops listening to <kbd>Esc</kbd>, otherwise players could open it on top of the game over screen.

The one-second wait stays: it gives the player a moment to see where they crashed before the menu covers it.

Run the game and crash. The result appears after a second, with **Play again** focused, so <kbd>Enter</kbd> starts a new round straight away.

```quiz
question: Why does **Play again** not need to reset the snake, food and score?
options:
  - reload_current_scene creates the whole game scene again, with fresh nodes
  - Godot remembers the starting value of every variable
  - It does need to; that's a bug
answer: 0
```
