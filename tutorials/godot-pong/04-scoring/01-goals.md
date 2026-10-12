---
title: Goals
description: Area2D zones and your first editor-connected signals.
estimatedMinutes: 15
---

A goal isn't solid; the ball should pass *into* it and we just want to know when that happens. That's what `Area2D` is for: it detects bodies entering and leaving, without blocking them.

## The goal zones

Add two `Area2D` nodes to `game.tscn`, each with a `CollisionShape2D` using a 100×400 rectangle:

| Node | Shape position |
| --- | --- |
| `LeftGoal` | (-60, 180) |
| `RightGoal` | (700, 180) |

Both sit off-screen behind the paddles. Set their **Layer** to `goals` and **Mask** to `ball`.

:::tip[Why so wide?]
At top speed the ball moves 15px per physics tick. A thin goal could be skipped over entirely between two ticks. 100px leaves plenty of margin.
:::

## Connecting signals in the editor

Select `LeftGoal`, open the **Node** dock → **Signals**, and double-click `body_entered`. Pick `Game` as the receiver and accept the suggested method name. Godot adds an empty `_on_left_goal_body_entered` to `game.gd`. Do the same for `RightGoal`.

```gdscript title="game.gd"
extends Node2D

## Index 0 is the left player, 1 is the right player.
var scores := [0, 0]

@onready var ball: CharacterBody2D = $Ball


func _ready() -> void:
	ball.serve([-1.0, 1.0].pick_random())


func _on_left_goal_body_entered(body: Node2D) -> void:
	if body == ball:
		_score(1) # The ball went past the left paddle: right player scores.


func _on_right_goal_body_entered(body: Node2D) -> void:
	if body == ball:
		_score(0)


func _score(player: int) -> void:
	scores[player] += 1
	print("Score: ", scores)
	ball.reset.call_deferred()
```

Signal connections made in the editor are stored in the scene file (look for `[connection ...]` lines in `game.tscn`), and a green icon appears next to the method in the script editor.

:::warning[Why call_deferred?]
`body_entered` fires *during* the physics step. Moving a physics body in the middle of that step can confuse the physics engine. `call_deferred` runs `reset()` at the end of the frame, when it's safe.
:::

Run the game and miss on purpose: the Output panel prints the score.

```quiz
question: What's the main difference between an Area2D and a StaticBody2D?
options:
  - Areas detect overlaps without blocking movement
  - Areas can't have collision shapes
  - Static bodies emit body_entered too
answer: 0
```
