---
title: Serving
description: A short pause, then serve towards whoever conceded.
estimatedMinutes: 10
---

Right now the ball resets to the centre and just sits there. Classic Pong pauses for a moment, then serves towards the player who conceded the point.

## A Timer node

You could write `await get_tree().create_timer(1.0).timeout`, but a **Timer node** is a better fit here. It lives inside the game scene, so it's paused when the game is paused and it disappears if you quit to the menu mid-countdown.

Add a `Timer` named `ServeTimer` to `game.tscn`: **Wait Time** `1`, **One Shot** on. Connect its `timeout` signal to `Game`.

```gdscript title="game.gd" ins={4,8,13-15,22-24,27-28}
extends Node2D

var scores := [0, 0]
var serve_direction := 1.0

@onready var ball: CharacterBody2D = $Ball
@onready var hud: CanvasLayer = $HUD
@onready var serve_timer: Timer = $ServeTimer


func _ready() -> void:
	hud.update_scores(0, 0)
	ball.reset()
	serve_direction = [-1.0, 1.0].pick_random()
	serve_timer.start()


func _score(player: int) -> void:
	scores[player] += 1
	hud.update_scores(scores[0], scores[1])
	ball.reset.call_deferred()
	# Serve towards the player who just conceded.
	serve_direction = -1.0 if player == 1 else 1.0
	serve_timer.start()


func _on_serve_timer_timeout() -> void:
	ball.serve(serve_direction)
```

That's a playable two-player Pong! The next chapters wrap it in menus and settings.

```quiz
question: The right player (index 1) just scored. Which way is the next serve?
options:
  - Left (-1), towards the player who conceded
  - Right (1), towards the scorer
  - Random
answer: 0
```
