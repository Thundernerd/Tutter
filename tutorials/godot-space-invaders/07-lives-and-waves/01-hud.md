---
title: The HUD
description: Score and lives on a CanvasLayer, and adding up points.
estimatedMinutes: 15
---

## The scene

The HUD is drawn on a `CanvasLayer`: its children are drawn in screen space, on top of the game and independent of any camera. That matters in chapter 10, when the screen shakes and the score should stay perfectly still.

New scene, `CanvasLayer` root named `HUD`, saved as `hud.tscn`:

```text
HUD (CanvasLayer)
├── ScoreLabel (Label, %)
├── HighScoreLabel (Label, %)
├── WaveLabel (Label, %)
├── LivesLabel (Label, %)
└── LifeIcons (HBoxContainer, %)   # separation 6
    ├── Life1 (TextureRect)        # sprites/player.png
    ├── …
    └── Life5 (TextureRect)
```

| Node | Position | Size | Notes |
| --- | --- | --- | --- |
| `ScoreLabel` | (12, 6) | 200×20 | text `SCORE 00000` |
| `HighScoreLabel` | (220, 6) | 200×20 | centred |
| `WaveLabel` | (428, 6) | 200×20 | right-aligned |
| `LivesLabel` | (12, 338) | 16×20 | text `3` |
| `LifeIcons` | (32, 340) | | five `TextureRect` children |

Right-click each node marked **%** and choose **Access as Unique Name**. Scripts can then find it with `%ScoreLabel` wherever it sits in the scene, so rearranging the layout later won't break any paths.

The `LifeIcons` box holds five copies of the ship picture. An `HBoxContainer` lines its children up left to right and closes the gap when one is hidden.

```gdscript title="hud.gd"
extends CanvasLayer

@onready var score_label: Label = %ScoreLabel
@onready var high_score_label: Label = %HighScoreLabel
@onready var wave_label: Label = %WaveLabel
@onready var lives_label: Label = %LivesLabel
@onready var life_icons: HBoxContainer = %LifeIcons


func set_score(score: int) -> void:
	score_label.text = "SCORE %05d" % score


func set_high_score(score: int) -> void:
	high_score_label.text = "HI-SCORE %05d" % score


func set_wave(wave: int) -> void:
	wave_label.text = "WAVE %d" % wave


func set_lives(lives: int) -> void:
	lives_label.text = str(lives)
	# Like the arcade, draw one ship per *spare* life: the ship you're flying isn't counted.
	for i in life_icons.get_child_count():
		life_icons.get_child(i).visible = i < lives - 1
```

- `%` after a string is the **format operator**. `%05d` means "a whole number, padded with zeros to five digits": 430 becomes `00430`, arcade style.
- With 3 lives, icons 0 and 1 are visible and the rest hidden.
- The HUD only exposes `set_` methods. The game never touches the labels directly, so you can redesign the HUD without changing any other script.

## Counting points

Instance `hud.tscn` in `game.tscn`, then make the game keep score:

```gdscript title="game.gd" ins={1,4,9}
var score := 0

@onready var formation: Node2D = $Formation
@onready var hud: CanvasLayer = $HUD
@onready var ufo_timer: Timer = $UfoTimer


func _ready() -> void:
	hud.set_score(score)
	formation.build(1)
	formation.start()
	ufo_timer.start()
```

Both kinds of kill now award points, and the UFO's `print` makes way for the real thing:

```gdscript title="game.gd" ins={2,8} del={7}
func _on_formation_invader_killed(invader: Invader) -> void:
	_add_score(invader.get_points())
	_spawn(EXPLOSION_SCENE, invader.global_position)


func _on_ufo_destroyed(points: int) -> void:
	print("Mystery ship: ", points)
	_add_score(points)
```

```gdscript title="game.gd"
func _add_score(points: int) -> void:
	score += points
	hud.set_score(score)
```

Every point goes through `_add_score`. That one place is where the high score and bonus life will hook in.

```quiz
question: What does `"SCORE %05d" % 1230` produce?
type: text
answer: ["SCORE 01230"]
hint: Five digits, padded with zeros on the left.
```
