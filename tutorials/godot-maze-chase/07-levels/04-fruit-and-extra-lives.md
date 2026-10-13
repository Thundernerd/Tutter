---
title: Bonus fruit and extra lives
description: A fruit that appears twice per level, and a free life at 10,000 points.
estimatedMinutes: 20
---

## Bonus fruit

Twice per level, after 70 and after 170 pellets, a piece of fruit appears just below the ghost house for about ten seconds. It's worth more on later levels:

| Fruit | Frame | Points | Levels |
| --- | --- | --- | --- |
| Cherry | 0 | 100 | 1 |
| Strawberry | 1 | 300 | 2 |
| Orange | 2 | 500 | 3–4 |
| Apple | 3 | 700 | 5 |
| Melon | 4 | 1000 | 6+ |

The `fruit` column in `LEVELS` already says which one each level uses.

Add a `Sprite2D` named `Fruit` under `World`, before `Player` so the player is drawn over it:

| Property | Value |
| --- | --- |
| Position | (140, 175) |
| Texture | `art/fruit.png` |
| Hframes | 5 |
| Visible | off |

`(140, 175)` is row 17, in the middle of the empty corridor under the house. Add a one-shot `Timer` named `FruitTimer` under `World` with **Wait Time** `9.5`, connected to `Game`. Then:

```gdscript title="game.gd"
const FRUIT_POINTS := [100, 300, 500, 700, 1000]
## The fruit appears after this many pellets have been eaten in a level.
const FRUIT_AT_PELLETS := [70, 170]

@onready var fruit: Sprite2D = $World/Fruit
@onready var fruit_timer: Timer = $World/FruitTimer


func _show_fruit() -> void:
	fruit.frame = _level_data().fruit
	fruit.show()
	fruit_timer.start()


func _on_fruit_timer_timeout() -> void:
	fruit.hide()


func _eat_fruit() -> void:
	var points: int = FRUIT_POINTS[fruit.frame]
	fruit.hide()
	fruit_timer.stop()
	_add_score(points)
	_show_points(points, fruit.position)
```

Show the fruit from `_on_player_ate_pellet`, before the level-clear check:

```gdscript title="game.gd"
	if (maze.pellets_total - maze.pellets_left) in FRUIT_AT_PELLETS:
		_show_fruit()
```

Eat it from `_physics_process`, after the ghost loop. It uses the same distance check as the ghosts:

```gdscript title="game.gd"
	if fruit.visible and player.position.distance_to(fruit.position) < TOUCH_DISTANCE:
		_eat_fruit()
```

And clear it away whenever the round ends: add `fruit.hide()` to `_start_round()`, and after hiding the ghosts in both `_lose_life()` and `_clear_level()`.

- Counting **eaten** pellets (`pellets_total - pellets_left`) instead of using `_pellets_this_life` means losing a life doesn't bring the fruit back early.
- `in` checks whether a value is in an array: `x in [70, 170]` is true for exactly those two numbers.
- `FruitTimer` is under `World`, so the fruit's ten seconds pause during freezes too.
- The fruit uses `_show_points`, the same floating label as eaten ghosts.

## Extra life

One free life at 10,000 points. Since every score change goes through `_add_score`, that's the only place to check:

```gdscript title="game.gd" ins={2,4-6}
func _add_score(points: int) -> void:
	var before := score
	score += points
	if before < EXTRA_LIFE_SCORE and score >= EXTRA_LIFE_SCORE:
		lives += 1
		hud.update_lives(lives)
	hud.update_score(score)
```

with `const EXTRA_LIFE_SCORE := 10000` at the top. Comparing the score *before* and *after* catches the moment the line is crossed, whichever pellet, ghost or fruit pushed you over it, and makes sure it only happens once.

That's a complete game loop: rounds, lives, levels that speed up, fruit and bonus lives. The next chapters wrap it in menus, options and polish.

```quiz
question: On level 3 you eat the fruit. How many points is it worth?
options:
  - "300"
  - "500"
  - "700"
answer: 1
explain: Level 3 uses fruit frame 2, the orange, worth 500.
```

```quiz
question: Why does the extra life check compare the score before and after adding points?
options:
  - To award the life exactly once, when the score crosses 10,000
  - Because `score` can go down
  - To make the check faster
answer: 0
```
