---
title: Eating and scoring
description: A signal when a pellet is eaten, a game script that keeps score, and a HUD.
estimatedMinutes: 20
---

## Eating

The player eats whatever is on a tile when it reaches the tile's centre. `Maze.eat_pellet()` already removes the pellet and says what it was; the player just has to ask, and tell the world about it with a **signal**:

```gdscript title="player.gd" ins={4,9-11}
class_name Player
extends Actor

signal ate_pellet(power: bool)

# ...

func _on_tile_center() -> void:
	var eaten := maze.eat_pellet(cell)
	if eaten != Maze.Pellet.NONE:
		ate_pellet.emit(eaten == Maze.Pellet.POWER)
	if maze.is_open(cell + next_direction):
		direction = next_direction
	elif not maze.is_open(cell + direction):
		direction = Vector2i.ZERO # Hit a wall: wait here.
```

The player doesn't know about scores, sounds or ghosts, and it shouldn't. It reports "I ate something" and moves on. Whoever cares can listen.

## The HUD

The score goes on a `CanvasLayer`, which draws in screen space on top of the game. New scene, `CanvasLayer` root named `HUD`, saved as `hud.tscn`:

```text
HUD (CanvasLayer)
├── LeftPanel (ColorRect)        # position (0, 0), size 180×360, colour #08080f
│   ├── ScoreTitle (Label)       # "SCORE"
│   ├── ScoreLabel (Label, %)    # "0"
│   └── Help (Label)             # "Arrows: move", "Esc: pause", "F1: ghost targets"
└── RightPanel (ColorRect)       # position (460, 0), size 180×360, colour #08080f
```

| Label | Position | Size | Font size | Font colour |
| --- | --- | --- | --- | --- |
| `ScoreTitle` | (24, 40) | 140×16 | 11 | grey (`#9999b3`) |
| `ScoreLabel` | (24, 54) | 140×28 | 22 | white |
| `Help` | (24, 280) | 150×50 | 10 | grey |

Set font sizes and colours under **Theme Overrides** in the Inspector. Right-click `ScoreLabel` and choose **Access as Unique Name** so the script can find it as `%ScoreLabel`.

The two panels have the same colour as the background, so they look like empty space. They have a second job: the maze sits between x = 180 and x = 460, and the panels cover everything outside it. When an actor runs into the tunnel and out of the maze, it disappears behind a panel, and `wrap_position` can move it to the other side unseen.

```gdscript title="hud.gd"
extends CanvasLayer

@onready var score_label: Label = %ScoreLabel


func update_score(score: int) -> void:
	score_label.text = str(score)
```

## The game script

Instance `hud.tscn` under `Game`, then give `Game` a script:

```gdscript title="game.gd"
extends Node2D

var score := 0

@onready var maze: Maze = $World/Maze
@onready var player: Player = $World/Player
@onready var hud: CanvasLayer = $HUD


func _ready() -> void:
	player.ate_pellet.connect(_on_player_ate_pellet)
	hud.update_score(score)


func _on_player_ate_pellet(power: bool) -> void:
	_add_score(50 if power else 10)


func _add_score(points: int) -> void:
	score += points
	hud.update_score(score)
```

- `player.ate_pellet.connect(...)` connects the signal in code. You could connect it in the editor's **Node** dock too; in code it sits right next to the function it calls.
- `50 if power else 10` is GDScript's inline *if*: a power pellet is worth 50, a normal one 10.
- All score changes go through `_add_score`. Later it will also award extra lives, and having a single place for that pays off.

Run the game and eat your way around the maze. The score climbs by 10 per pellet and 50 per power pellet. When every pellet is gone... nothing happens yet. That's chapter 7.

```quiz
question: Why does the player emit `ate_pellet` instead of updating the score itself?
options:
  - Signals are faster than function calls
  - The player stays independent of the score, HUD and sounds; anything interested can connect to the signal
  - The player can't access the HUD
answer: 1
```

```quiz
question: Besides being a background, what do the HUD's side panels do?
options:
  - They hide actors that leave the maze through the tunnel
  - They stop actors leaving the screen
  - They catch mouse clicks
answer: 0
```
