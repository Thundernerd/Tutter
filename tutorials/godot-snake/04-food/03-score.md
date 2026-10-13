---
title: Score display
description: A HUD scene on a CanvasLayer, and formatting text.
estimatedMinutes: 15
---

The score belongs on screen, not in the Output panel. Text on top of the game is usually called the **HUD** (heads-up display).

## A separate scene

The HUD gets its own scene. That keeps `game.tscn` tidy, and the game only needs to know one thing about the HUD: "here's the new score".

Create a new scene (**Scene → New Scene**) with a `CanvasLayer` root named `HUD`, add a `Label` child named `ScoreLabel`, and save it as `hud.tscn`.

```text
HUD (CanvasLayer)
└── ScoreLabel (Label)   # unique name
```

Set up the label in the Inspector:

| Property | Value |
| --- | --- |
| Text | `Score: 0` |
| Layout → Transform → Position | (32, 5) |
| Layout → Transform → Size | (200, 22) |
| Theme Overrides → Font Sizes → Font Size | `16` |

That puts the score in the strip above the board, lined up with its left edge.

Finally, right-click `ScoreLabel` and choose **Access as Unique Name**. A `%` sign appears next to it. Scripts can now find it with `%ScoreLabel`, wherever it is in the scene; if you later move it into a container, nothing breaks.

:::note[Why a CanvasLayer?]
A `CanvasLayer` draws its children on a separate layer, in **screen** coordinates, on top of the game. The HUD stays put no matter what happens in the game world, and later the pause and game over screens will each sit on their own layer above it.
:::

## The script

Attach `hud.gd` to `HUD`:

```gdscript title="hud.gd"
extends CanvasLayer

@onready var score_label: Label = %ScoreLabel


func update_score(score: int) -> void:
	score_label.text = "Score: %d" % score
```

`"Score: %d" % score` is a **format string**: `%d` is a placeholder that gets replaced by the number after the `%` operator. A few placeholders you'll see:

| Placeholder | Example | Result |
| --- | --- | --- |
| `%d` | `"%d apples" % 3` | `3 apples` |
| `%s` | `"Hi %s" % "Sam"` | `Hi Sam` |
| `%.1f` | `"%.1f s" % 2.345` | `2.3 s` |
| several | `"%d / %d" % [3, 10]` | `3 / 10` |

## Add it to the game

Open `game.tscn` and drag `hud.tscn` from the FileSystem dock onto `Game`. That creates an **instance** of the HUD scene inside the game scene: the whole HUD, as a single node. Then update `game.gd`:

```gdscript title="game.gd" ins={2,7}
@onready var move_timer: Timer = $MoveTimer
@onready var hud: CanvasLayer = $HUD


func _ready() -> void:
	snake.reset(START_CELL, START_LENGTH)
	hud.update_score(score)
	_place_food()
	move_timer.start()
```

```gdscript title="game.gd" ins={4} del={3}
func _eat() -> void:
	score += 1
	print("Score: ", score)
	hud.update_score(score)
	_place_food()
```

`game.gd` doesn't know there's a label inside the HUD; it only calls `update_score`. You could redesign the HUD completely, and the game script wouldn't change.

Run the game. The score counts up as you eat. That's a real game loop: move, eat, grow, score. It just can't end yet.

```quiz
type: text
question: What does `"%d of %d" % [2, 5]` produce?
answer: ["2 of 5"]
```

```quiz
question: What does "Access as Unique Name" let a script do?
options:
  - Find the node with `%ScoreLabel`, wherever it is in the scene
  - Rename the node at runtime
  - Use the node from every scene in the game
answer: 0
explain: The `%` lookup works anywhere within the same scene, so rearranging the layout doesn't break the script.
```
