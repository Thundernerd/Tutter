---
title: Score display
description: A HUD on a CanvasLayer.
estimatedMinutes: 10
---

## Why a CanvasLayer?

UI should stay put when the camera moves (and we *will* shake the camera later). A `CanvasLayer` draws its children in screen space, independent of any camera.

New scene, `CanvasLayer` root named `HUD`, saved as `hud.tscn`, with two `Label`s:

| Label | Position | Size | Text |
| --- | --- | --- | --- |
| `LeftScore` | (220, 12) | 80×58 | `0` |
| `RightScore` | (340, 12) | 80×58 | `0` |

Set both to **Horizontal Alignment: Center** and give them a font size override of `48` (Inspector → **Theme Overrides → Font Sizes**).

```gdscript title="hud.gd"
extends CanvasLayer

@onready var left_score: Label = $LeftScore
@onready var right_score: Label = $RightScore


func update_scores(left: int, right: int) -> void:
	left_score.text = str(left)
	right_score.text = str(right)
```

## Hook it up

Instance `hud.tscn` in `game.tscn`, then update it whenever someone scores:

```gdscript title="game.gd" ins={2,6,12}
@onready var ball: CharacterBody2D = $Ball
@onready var hud: CanvasLayer = $HUD


func _ready() -> void:
	hud.update_scores(0, 0)
	ball.serve([-1.0, 1.0].pick_random())


func _score(player: int) -> void:
	scores[player] += 1
	hud.update_scores(scores[0], scores[1])
	ball.reset.call_deferred()
```

The HUD only exposes `update_scores`. `game.gd` doesn't care that there are labels inside, so you could redesign the HUD completely without touching the game script.

```quiz
question: Why put the score labels on a CanvasLayer instead of directly under Game?
options:
  - Labels only render on CanvasLayers
  - So they stay fixed on screen even when the camera moves
  - CanvasLayers make text sharper
answer: 1
```
