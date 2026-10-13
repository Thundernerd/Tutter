---
title: A saved high score
description: An autoload that remembers the best score, saved to disk with ConfigFile.
estimatedMinutes: 20
---

A high score should survive two things: changing scenes (the game scene is thrown away when you return to the menu), and quitting the game. That needs global state and a file.

## Autoloads

An **autoload** is a script (or scene) Godot creates once at startup and keeps alive alongside every scene. Its name becomes a global: anywhere in the project, `HighScore.best` just works.

Create `high_score.gd` (a script file, not attached to any node):

```gdscript title="high_score.gd"
extends Node
## The best score so far, saved between sessions. Registered as the "HighScore" autoload.

const SAVE_PATH := "user://highscore.cfg"

var best := 0


func _ready() -> void:
	var config := ConfigFile.new()
	if config.load(SAVE_PATH) == OK:
		best = config.get_value("scores", "best", 0)


## Records `score` if it beats the best. Returns true for a new high score.
func submit(score: int) -> bool:
	if score <= best:
		return false
	best = score
	var config := ConfigFile.new()
	config.set_value("scores", "best", best)
	config.save(SAVE_PATH)
	return true
```

Register it in **Project Settings → Globals → Autoload**: pick `high_score.gd`, name it `HighScore`, and click **Add**.

- **`user://`** is a writable folder for each user: `%APPDATA%\Godot\app_userdata\Maze Muncher` on Windows, `~/Library/Application Support/Godot/app_userdata/Maze Muncher` on macOS, `~/.local/share/godot/app_userdata/Maze Muncher` on Linux. `res://` is your project folder, which is read-only in an exported game, so never save there.
- **`ConfigFile`** reads and writes INI-style files with sections and keys. `get_value`'s third argument is the default when the file or key doesn't exist yet.
- **`submit`** only writes the file when the score is actually a record, and tells the caller so the game over screen can celebrate.

The saved file is plain text:

```ini title="highscore.cfg"
[scores]

best=12340
```

## Showing it

Add a high score to the HUD's left panel, below the score:

| Node | Position | Size | Notes |
| --- | --- | --- | --- |
| `HighScoreTitle` (Label) | (24, 100) | 140×16 | "HIGH SCORE", font size 11, grey |
| `HighScoreLabel` (Label, %) | (24, 114) | 140×28 | "0", font size 22 |

and update it together with the score. While you're beating the record, the HUD shows your score as the new high score live:

```gdscript title="hud.gd" ins={2,7}
@onready var score_label: Label = %ScoreLabel
@onready var high_score_label: Label = %HighScoreLabel


func update_score(score: int) -> void:
	score_label.text = str(score)
	high_score_label.text = str(maxi(score, HighScore.best))
```

On the main menu, fill in the `HighScoreLabel` from page 1:

```gdscript title="main_menu.gd" ins={5,9}
extends Control

@onready var play_button: Button = %PlayButton
@onready var quit_button: Button = %QuitButton
@onready var high_score_label: Label = %HighScoreLabel


func _ready() -> void:
	high_score_label.text = "High score: %d" % HighScore.best
	# Browsers can't close the tab for us, so hide Quit in web builds.
	quit_button.visible = not OS.has_feature("web")
	play_button.grab_focus()
```

`"High score: %d" % HighScore.best` is GDScript's format operator: `%d` is replaced by the integer.

The score is submitted when the game ends, on the next page.

```quiz
question: Why does the high score live in an autoload rather than in game.gd?
options:
  - Autoloads are saved to disk automatically
  - The game scene is freed when you go back to the menu; an autoload lives as long as the game runs
  - Scripts attached to scenes can't use ConfigFile
answer: 1
```

```quiz
question: Why must the high score be saved to `user://` and not `res://`?
options:
  - user:// is faster
  - res:// is read-only once the game is exported
  - ConfigFile only supports user://
answer: 1
```
