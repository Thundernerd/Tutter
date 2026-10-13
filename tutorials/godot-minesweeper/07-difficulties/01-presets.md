---
title: Presets and a Settings autoload
description: Global state that survives scene changes, and the board sizes it holds.
estimatedMinutes: 15
---

## Why an autoload?

The difficulty is chosen on one screen (the menu) and used on another (the game). When Godot changes scenes, it frees the old scene and every variable in it. So the choice can't live in either scene.

An **autoload** is a script (or scene) Godot creates once at startup and keeps alive alongside every scene. Its name becomes a global variable: anywhere in the project, `Settings.difficulty` just works.

Our autoload is called `Settings` because it will grow to hold the options screen's settings too (volume, fullscreen, key bindings) and save them all to disk. For now, it only knows about board sizes.

## The script

Create `settings.gd` (a script file, not attached to anything):

```gdscript title="settings.gd"
extends Node
## Global game settings. Registered as the "Settings" autoload.

const PRESETS := {
	"beginner": {"name": "Beginner", "width": 9, "height": 9, "mines": 10},
	"intermediate": {"name": "Intermediate", "width": 16, "height": 16, "mines": 40},
	"expert": {"name": "Expert", "width": 30, "height": 16, "mines": 99},
}
const CUSTOM_MIN_SIZE := Vector2i(5, 5)
const CUSTOM_MAX_SIZE := Vector2i(40, 20)

## A key of PRESETS, or "custom".
var difficulty := "beginner"
var custom_width := 20
var custom_height := 12
var custom_mines := 40


## The size and mine count of the board to play next.
func board_config() -> Dictionary:
	if difficulty == "custom":
		return {"name": "Custom", "width": custom_width, "height": custom_height, "mines": custom_mines}
	return PRESETS[difficulty]


## Leave room for the 3×3 opening around the first click.
func max_mines(width: int, height: int) -> int:
	return width * height - 9
```

- **`PRESETS`** is a dictionary of dictionaries: the key (`"beginner"`) identifies a difficulty, and the value holds its display name and board size. Adding a fourth preset is one line, and every screen that lists presets will pick it up.
- **`board_config()`** hides the difference between presets and custom boards: callers always get a dictionary with `width`, `height` and `mines`.
- **`max_mines`** is the rule from the safe-first-click page, written down once. The custom board screen will use it to stop players from asking for an impossible board.

Register it in **Project Settings → Globals → Autoload**: pick `settings.gd`, name it `Settings`, and click **Add**.

:::note[Dictionary keys with dots]
`config.width` and `config["width"]` mean the same thing for a dictionary with a `"width"` key. The dot version is shorter; the bracket version works with keys stored in variables and keys that aren't valid names.
:::

## Use it in the game

The game no longer hard-codes a 9×9 board:

```gdscript title="game.gd" del={2} ins={3-4}
func _ready() -> void:
	model = BoardModel.new(9, 9, 10)
	var config := Settings.board_config()
	model = BoardModel.new(config.width, config.height, config.mines)
	board.setup(model, 32)
	hud.set_mines_left(model.flags_left())
	hud.set_time(0.0)
```

To try it, change `var difficulty := "beginner"` to `"intermediate"` in `settings.gd` and run the game... and the board runs off the bottom of the screen: 16 rows of 32 pixels is 512 pixels, and our screen is 360 tall. Change it back for now; the next page fixes this properly.

```quiz
question: Why can't the chosen difficulty be stored in a variable of the difficulty menu scene?
options:
  - Scenes can't have variables
  - Changing to the game scene frees the menu scene, and its variables with it
  - Only autoloads can be read from other scripts
answer: 1
explain: An autoload lives for the whole run of the game, outside of any scene, so values in it survive scene changes.
```

```quiz
question: What does `Settings.board_config()` return when `difficulty` is `"expert"`?
options:
  - '`{"name": "Expert", "width": 30, "height": 16, "mines": 99}`'
  - The string "expert"
  - The custom board size
answer: 0
explain: It looks up the preset by its key. Only "custom" builds a dictionary from the custom_* variables.
```

```quiz
question: How many mines can a 6 × 5 custom board have at most?
type: text
answer: ["21"]
explain: 6 × 5 = 30 cells, minus the 9 kept clear around the first click.
```
