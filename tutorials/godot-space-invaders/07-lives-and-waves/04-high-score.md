---
title: The high score
description: ConfigFile, the user:// folder, and a class with only static functions.
estimatedMinutes: 15
---

A high score that's forgotten when you close the game isn't much of a high score. We'll save it to a small file on disk.

## Where to save

Godot gives every project two special folders:

| Path | Is | Can write? |
| --- | --- | --- |
| `res://` | Your project folder | Only in the editor. Exported games pack it into a read-only archive. |
| `user://` | A per-user data folder | Always. On macOS it's `~/Library/Application Support/Godot/app_userdata/Space Invaders`; on Windows `%APPDATA%\Godot\app_userdata\Space Invaders`. |

Saves always go to `user://`.

## A static helper

Create a new script, `high_score.gd`. It isn't attached to any node:

```gdscript title="high_score.gd"
class_name HighScore
## Loads and saves the best score. Every function is static, so no instance is needed:
## call HighScore.load_best() from anywhere.

const SAVE_PATH := "user://high_score.cfg"


static func load_best() -> int:
	var config := ConfigFile.new()
	if config.load(SAVE_PATH) != OK:
		return 0 # No file yet: nobody has played.
	return config.get_value("scores", "best", 0)


static func save_best(score: int) -> void:
	var config := ConfigFile.new()
	config.set_value("scores", "best", score)
	config.save(SAVE_PATH)
```

- **`static func`** belongs to the class, not to an instance. Thanks to `class_name`, any script can call `HighScore.load_best()` without creating anything. The main menu will use it too.
- There's no `extends`. A script without it extends `RefCounted`, the lightest kind of object, which is plenty for a bag of functions.
- **`ConfigFile`** reads and writes INI-style files with sections and keys. `get_value`'s third argument is the fallback when the key is missing.

The saved file is plain text:

```ini title="high_score.cfg"
[scores]

best=2780
```

## Use it in the game

```gdscript title="game.gd" ins={2}
var score := 0
var high_score := 0
var lives := 3
```

```gdscript title="game.gd" ins={2,4}
func _ready() -> void:
	high_score = HighScore.load_best()
	hud.set_score(score)
	hud.set_high_score(high_score)
	hud.set_lives(lives)
	_start_wave()
```

The HUD's high score climbs along with your score once you pass it:

```gdscript title="game.gd" ins={4-6}
func _add_score(points: int) -> void:
	score += points
	hud.set_score(score)
	if score > high_score:
		high_score = score
		hud.set_high_score(high_score)
	if not _extra_life_awarded and score >= EXTRA_LIFE_SCORE:
		_extra_life_awarded = true
		lives += 1
		hud.set_lives(lives)
```

And it's saved when the game ends, if it's a new best:

```gdscript title="game.gd" ins={4-6}
func _end_game() -> void:
	formation.stop()
	ufo_timer.stop()
	var new_high_score := score > HighScore.load_best()
	if new_high_score:
		HighScore.save_best(score)
	print("Game over! Score: ", score)
```

We compare against the file, not against `high_score`: by now `high_score` has been climbing with the score, so it would always be equal.

```quiz
question: Why can't the high score be saved to `res://high_score.cfg`?
options:
  - ConfigFile only supports user://
  - res:// is read-only once the game is exported
  - res:// is cleared every time the game starts
answer: 1
```

```quiz
question: How do you call a static function `load_best` on a script with `class_name HighScore`?
type: text
answer: ["HighScore.load_best()", "HighScore.load_best"]
```
