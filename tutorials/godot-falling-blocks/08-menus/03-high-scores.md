---
title: High scores
description: A second autoload that keeps the best five games on disk, and a table that shows them.
estimatedMinutes: 25
---

High scores have to outlive every scene: the game adds to them, the game over screen and the main menu show them, and they should still be there next time the game starts. Scenes come and go, so the scores can't live in one.

## Autoloads

An **autoload** is a script (or scene) Godot creates once at startup and keeps alive alongside every scene. Its name becomes a global variable, so anywhere in the project `HighScores.entries` just works.

## Saving with ConfigFile

Create `high_scores.gd` (a script file, not attached to anything):

```gdscript title="high_scores.gd"
extends Node
## The best scores, kept between sessions. Registered as the "HighScores" autoload.

const SAVE_PATH := "user://high_scores.cfg"
const MAX_ENTRIES := 5

## Best first. Each entry looks like {"score": 1200, "lines": 14, "level": 2}.
var entries: Array[Dictionary] = []


func _ready() -> void:
	load_scores()


## Record a finished game. Returns its place in the table (0 is the best),
## or -1 if it didn't make the table.
func submit(score: int, lines: int, level: int) -> int:
	if score <= 0:
		return -1
	var rank := 0
	while rank < entries.size() and entries[rank]["score"] >= score:
		rank += 1
	if rank >= MAX_ENTRIES:
		return -1
	entries.insert(rank, {"score": score, "lines": lines, "level": level})
	if entries.size() > MAX_ENTRIES:
		entries.resize(MAX_ENTRIES)
	save_scores()
	return rank


func save_scores() -> void:
	var config := ConfigFile.new()
	config.set_value("scores", "entries", entries)
	config.save(SAVE_PATH)


func load_scores() -> void:
	var config := ConfigFile.new()
	if config.load(SAVE_PATH) != OK:
		return
	entries.assign(config.get_value("scores", "entries", []))
```

Register it in **Project Settings → Globals → Autoload**: pick `high_scores.gd`, name it `HighScores`, and click **Add**.

### Things worth understanding

- **`user://`** is a per-user, writable folder: `%APPDATA%\Godot\app_userdata\Blockfall` on Windows, `~/Library/Application Support/Godot/app_userdata/Blockfall` on macOS and `~/.local/share/godot/app_userdata/Blockfall` on Linux. `res://` is your project folder, which is read-only in exported games, so never save there.
- **`ConfigFile`** writes an INI-style text file with sections and keys. It can store any Godot value, including arrays of dictionaries, so the whole table is one key. `get_value`'s third argument is the fallback when the key doesn't exist.
- **Ranking** walks down the table while the existing score is at least as good, so a tie goes *below* the older entry: whoever got there first keeps their place. Then `insert` puts the new entry in, and `resize` drops whatever fell off the bottom.
- **`assign`** copies the loaded (untyped) array into our typed `Array[Dictionary]`.

The saved file is readable, which is handy for debugging. Even the array's type is remembered:

```ini title="high_scores.cfg"
[scores]

entries=Array[Dictionary]([{
"level": 3,
"lines": 24,
"score": 6420
}, {
"level": 1,
"lines": 6,
"score": 812
}])
```

## A reusable table

Both the main menu and the game over screen show the table, so make it its own scene. Create a scene with a `GridContainer` root named `HighScoreTable`: **Columns** `4`, **H Separation** `16`, **V Separation** `2`. Save it as `high_score_table.tscn` and attach:

```gdscript title="high_score_table.gd"
extends GridContainer
## A table of the saved high scores. Used by the main menu and the game over screen.

const HEADER_COLOR := Color(0.6, 0.62, 0.72)
const HIGHLIGHT_COLOR := Color(0.95, 0.83, 0.23)


func _ready() -> void:
	refresh()


## Rebuild the rows. The row at index `highlight` is drawn in a highlight colour.
func refresh(highlight := -1) -> void:
	for child in get_children():
		child.free()
	_add_row(["", "Score", "Lines", "Level"], HEADER_COLOR)
	for i in HighScores.MAX_ENTRIES:
		var color := HIGHLIGHT_COLOR if i == highlight else Color.WHITE
		if i < HighScores.entries.size():
			var entry: Dictionary = HighScores.entries[i]
			_add_row(["%d." % (i + 1), str(entry["score"]), str(entry["lines"]), str(entry["level"])], color)
		else:
			_add_row(["%d." % (i + 1), "-", "-", "-"], color)


func _add_row(texts: Array, color: Color) -> void:
	for text in texts:
		var label := Label.new()
		label.text = text
		label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
		label.modulate = color
		add_child(label)
```

- A `GridContainer` with 4 columns fills row by row, so adding four labels at a time makes one table row.
- The table always shows five rows, with dashes for empty places. That keeps the layout the same size whether you've played zero games or fifty.
- **`free()`** instead of `queue_free()`: `queue_free` waits until the end of the frame, so for a moment the grid would contain the old *and* the new labels. These labels are ours alone and nothing else refers to them, so freeing them immediately is safe.
- **`modulate`** tints a node and everything it draws, an easy way to colour a whole label.

## On the main menu

Open `main_menu.tscn` and add a second column next to `Menu`:

```text
└── Columns (HBoxContainer)
    ├── Menu (VBoxContainer)              # as before
    └── Scores (VBoxContainer)            # separation 8, vertical size flags: Shrink Center
        ├── ScoresTitle (Label)           # "High scores", font size 18, centred
        └── HighScoreTable (high_score_table.tscn)
```

Drag `high_score_table.tscn` from the FileSystem dock onto `Scores` to instance it. It fills itself in `_ready()`, so the main menu script doesn't change at all. Run the game: the table shows five empty places, waiting for the game over screen to fill them.

```quiz
question: The table holds 900, 700, 500, 300, 100. Which place does a new score of 700 get?
options:
  - "Second (index 1), pushing the old 700 down"
  - "Third (index 2), below the old 700"
  - It doesn't make the table
answer: 1
hint: Look at the `>=` in the while loop.
explain: The loop skips every entry that is **at least** 700, so it passes 900 and the old 700 and stops at index 2. Ties go below the score that was there first.
```

```quiz
question: Why must the high scores be saved to `user://` and not `res://`?
options:
  - user:// is faster
  - res:// is read-only once the game is exported
  - ConfigFile can only write to user://
answer: 1
explain: Exported games pack `res://` into a read-only archive. `user://` always points at a writable per-user folder.
```
