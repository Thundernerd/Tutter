---
title: The HUD
description: Score, level and lines on a CanvasLayer, laid out with a container.
estimatedMinutes: 15
---

## Why a CanvasLayer?

HUD elements should stay put on screen, even when the camera moves (and in the polish chapter, the camera will shake on every hard drop). A `CanvasLayer` draws its children in screen space, independent of any camera, so the HUD never shakes.

## The scene

Create a new scene with a `CanvasLayer` root named `HUD` and save it as `hud.tscn`. The labels go in a `VBoxContainer`, which stacks its children vertically, to the left of the well:

```text
HUD (CanvasLayer)
└── LeftPanel (VBoxContainer)      # position (144, 18), size 80×322, separation 4
    ├── ScoreTitle (Label)         # "SCORE", font size 12, grey
    ├── ScoreLabel (Label, %)      # "0", font size 20
    ├── LevelTitle (Label)         # "LEVEL", font size 12, grey
    ├── LevelLabel (Label, %)      # "1", font size 20
    ├── LinesTitle (Label)         # "LINES", font size 12, grey
    └── LinesLabel (Label, %)      # "0", font size 20
```

- Set the container's position and size in the Inspector under **Layout → Transform**, and its **Separation** under **Theme Overrides → Constants**.
- Font sizes go under **Theme Overrides → Font Sizes**, and the grey (`#999eb8`) under **Theme Overrides → Colors → Font Color**.
- The `%` means **Access as Unique Name**: right-click each of the three value labels and pick it. Scripts can then find them with `%ScoreLabel`, wherever they are in the tree, so rearranging the layout later won't break any paths.

The panel ends at x = 224, leaving a 16 px gap before the well's frame at x = 238.

## The script

Attach a script to `HUD`:

```gdscript title="hud.gd"
extends CanvasLayer

@onready var score_label: Label = %ScoreLabel
@onready var level_label: Label = %LevelLabel
@onready var lines_label: Label = %LinesLabel


func update_stats(score: int, level: int, lines: int) -> void:
	score_label.text = str(score)
	level_label.text = str(level)
	lines_label.text = str(lines)
```

The HUD exposes a single function. The game doesn't need to know there are labels inside, so you could redesign the HUD completely without touching `game.gd`.

## Hook it up

Instance `hud.tscn` in `game.tscn` (drag it from the FileSystem dock onto `Game`), then call `update_stats` whenever a number changes:

```gdscript title="game.gd" ins={2,8,21,26} del={20}
@onready var board: Board = $Board
@onready var hud: CanvasLayer = $HUD
@onready var gravity_timer: Timer = $GravityTimer
@onready var lock_timer: Timer = $LockTimer


func _ready() -> void:
	hud.update_stats(score, level, lines)
	_spawn(bag.next())

# ...

func _score_lines(count: int) -> void:
	lines += count
	score += LINE_SCORES[count] * level
	@warning_ignore("integer_division")
	var new_level := lines / LINES_PER_LEVEL + 1
	if new_level > level:
		level = new_level
	print("Score: %d  Lines: %d  Level: %d" % [score, lines, level])
	hud.update_stats(score, level, lines)


func _add_score(points: int) -> void:
	score += points
	hud.update_stats(score, level, lines)
```

Both ways the score can change now update the HUD, and `_ready` fills it in once at the start so it doesn't show stale text from the editor.

That's a complete, playable game! Pieces fall faster as you level up, and the score tells you how you're doing. The next chapter adds the features that make modern falling blocks games feel good to play.

```quiz
question: What does `%ScoreLabel` find?
options:
  - A direct child named ScoreLabel
  - The node marked as unique name ScoreLabel, anywhere in the same scene
  - Any node named ScoreLabel in the whole game
answer: 1
explain: Unique names are looked up within the scene that owns the node, at any depth. Moving the label to another container doesn't break the script.
```

```quiz
question: Why put the HUD on a CanvasLayer instead of directly under Game?
options:
  - Labels only render on CanvasLayers
  - So it stays fixed on screen even when the camera moves or shakes
  - CanvasLayers make text sharper
answer: 1
```
