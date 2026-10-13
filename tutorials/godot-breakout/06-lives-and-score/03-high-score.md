---
title: Saving the high score
description: ConfigFile, the user:// folder, and a class with static functions.
estimatedMinutes: 15
---

A high score that resets every time you start the game isn't much of a high score. It has to be written to a file.

## Where to save

Godot has two special folders:

| Path | What | Writable? |
| --- | --- | --- |
| `res://` | Your project folder. In an exported game, packed into the game file. | Only in the editor |
| `user://` | A per-user data folder for this game | Always |

`user://` is `%APPDATA%\Godot\app_userdata\Breakout` on Windows, `~/Library/Application Support/Godot/app_userdata/Breakout` on macOS and `~/.local/share/godot/app_userdata/Breakout` on Linux. Saves, settings and high scores belong there.

## ConfigFile

`ConfigFile` reads and writes simple INI-style text files made of `[sections]` and `key=value` lines. It's perfect for small amounts of data like a score or a few settings.

## A class with static functions

The game needs the high score (to save it and show it in the HUD), and so will the main menu (to show it there). A tiny class with **static functions** serves both without any setup:

```gdscript title="high_score.gd"
class_name HighScore
## Loads and saves the best score. Everything is static: call HighScore.load_best().

const SAVE_PATH := "user://high_score.cfg"


static func load_best() -> int:
	var config := ConfigFile.new()
	if config.load(SAVE_PATH) != OK:
		return 0 # No file yet: nobody has played.
	return config.get_value("scores", "best", 0)


## Saves `score` if it beats the best so far. Returns true for a new high score.
static func submit(score: int) -> bool:
	if score <= load_best():
		return false
	var config := ConfigFile.new()
	config.set_value("scores", "best", score)
	config.save(SAVE_PATH)
	return true
```

- A `static func` belongs to the class itself, not to an object. You call it as `HighScore.load_best()`, without creating a `HighScore` first.
- The script has no `extends`, so it extends `RefCounted`, the lightweight base class for plain objects. Nothing ever instantiates it anyway.
- `config.load()` returns an error code. `OK` means the file was read. On the very first run there's no file yet, so we return 0.
- `get_value`'s third argument is the default when the key isn't there.

The file it writes is human-readable:

```ini title="high_score.cfg"
[scores]

best=2340
```

## Use it

Load the best score when the game starts, and submit the final score when the last life is lost:

```gdscript title="game.gd" ins={2,13}
func _ready() -> void:
	best = HighScore.load_best()
	hud.update_score(score, best)
	hud.update_lives(lives)
	_start_level(0)


func _on_kill_zone_body_entered(body: Node2D) -> void:
	body.queue_free()
	lives -= 1
	hud.update_lives(lives)
	if lives == 0:
		HighScore.submit(score)
		get_tree().reload_current_scene.call_deferred() # A game over screen comes in the menus chapter.
	else:
		_reset_round.call_deferred()
```

Lose all three lives, and the HUD's *Best* survives the restart.

:::tip[Finding the file]
**Project → Open User Data Folder** opens `user://` for the current project. Delete `high_score.cfg` there to reset the high score while testing.
:::

```quiz
question: Why can't the high score be saved to `res://high_score.cfg`?
options:
  - ConfigFile only supports user://
  - res:// is read-only in an exported game
  - res:// is deleted when the game quits
answer: 1
explain: Exported games pack `res://` into the game file. `user://` is always writable.
```

```quiz
question: How do you call a static function `load_best` on the class `HighScore`?
type: text
answer: ["HighScore.load_best()", "HighScore.load_best"]
```
