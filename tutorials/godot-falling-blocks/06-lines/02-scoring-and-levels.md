---
title: Scoring and levels
description: Points per clear, a level every ten lines, and a speed curve.
estimatedMinutes: 20
---

## The rules

We'll use the scoring most modern games share:

| Action | Points |
| --- | --- |
| Clear 1 line | 100 × level |
| Clear 2 lines | 300 × level |
| Clear 3 lines | 500 × level |
| Clear 4 lines at once | 800 × level |
| Soft drop | 1 per row |
| Hard drop | 2 per row (next chapter) |

Clearing four lines with one piece is worth twice as much as four singles, so it pays to stack cleanly and wait for an `I`. Every **10 lines** the level goes up by one, and the level both multiplies line points and speeds up gravity.

## A speed curve

Gravity uses a formula that many games in the genre follow, giving the time per row at each level:

```text
seconds per row = (0.8 − (level − 1) × 0.007) ^ (level − 1)
```

| Level | Seconds per row | Rows per second |
| --- | --- | --- |
| 1 | 1.000 | 1 |
| 2 | 0.793 | 1.3 |
| 3 | 0.618 | 1.6 |
| 5 | 0.355 | 2.8 |
| 7 | 0.190 | 5.3 |
| 10 | 0.064 | 15.6 |
| 15 | 0.007 | 60 (one per frame) |

The curve starts gentle and gets brutal around level 10. We stop speeding up at level 15, where the piece already drops a row every frame: a `Timer` can't fire more than once per frame, so faster values wouldn't change anything.

## The code

Replace `FALL_INTERVAL` with the speed curve, and add the score, lines and level. For now, the score is printed to the Output panel; the next page puts it on screen.

```gdscript title="game.gd" ins={5-9,18-20,28-33,39-40,46,58,62-73} del={3-4,37-38,45}
extends Node2D

## Seconds per row. Chapter 6 turns this into a speed curve.
const FALL_INTERVAL := 1.0
## Points for clearing 0, 1, 2, 3 or 4 lines at once, before multiplying by the level.
const LINE_SCORES: Array[int] = [0, 100, 300, 500, 800]
const LINES_PER_LEVEL := 10
## Gravity stops speeding up after this level.
const MAX_SPEED_LEVEL := 15
## Seconds per row while soft drop is held.
const SOFT_DROP_INTERVAL := 0.05
## How often moving or rotating on the ground may restart the lock delay.
const MAX_LOCK_RESETS := 15

## The falling piece, or null between pieces and after game over.
var piece: Tetromino
var bag := PieceBag.new()
var score := 0
var lines := 0
var level := 1

# ...

func _ready() -> void:
	_spawn(bag.next())


## Seconds per row at `for_level`. Level 1 is one row per second.
static func fall_interval(for_level: int) -> float:
	var steps := mini(for_level, MAX_SPEED_LEVEL) - 1
	return pow(0.8 - steps * 0.007, steps)


# ...

func _on_gravity_timer_timeout() -> void:
	if piece:
		_try_move(Vector2i.DOWN)
	if piece and _try_move(Vector2i.DOWN) and _soft_dropping:
		_add_score(1)

# ...

func _restart_gravity() -> void:
	var interval := FALL_INTERVAL
	var interval := fall_interval(level)
	if _soft_dropping:
		interval = minf(interval, SOFT_DROP_INTERVAL)
	gravity_timer.start(interval)

# ...

func _lock_piece() -> void:
	# ...
	var full := board.full_rows()
	if not full.is_empty():
		board.clear_rows(full)
		_score_lines(full.size())
	_spawn(bag.next())


func _score_lines(count: int) -> void:
	lines += count
	score += LINE_SCORES[count] * level
	@warning_ignore("integer_division")
	var new_level := lines / LINES_PER_LEVEL + 1
	if new_level > level:
		level = new_level
	print("Score: %d  Lines: %d  Level: %d" % [score, lines, level])


func _add_score(points: int) -> void:
	score += points
```

A few things to notice:

- **`fall_interval` is `static`**: it only depends on its argument, not on any game state. Static functions are easy to reason about and easy to test: `game.fall_interval(10)` gives the same answer whatever is happening in the game.
- **`_restart_gravity` already runs for every new piece**, so a level-up speeds up gravity from the next piece onwards without any extra code.
- **Soft drop points** come from the gravity callback: `piece and _try_move(...) and _soft_dropping` only adds a point when there *is* a piece, it actually moved down, and soft drop is held. `and` stops at the first false value, so `_try_move` isn't even called without a piece.
- **The level** is `lines / 10 + 1`, rounded down. Dividing two integers rounds down in GDScript, and Godot warns about it because it's often a mistake. Here it's exactly what we want, so `@warning_ignore("integer_division")` tells Godot we meant it, for that one line.
- **Points use the level before the clear.** We add the line score first, then check for a level-up, so the clear that takes you to level 2 still scores at level 1.

Run the game, clear a few lines and watch the Output panel.

```quiz
question: You're on level 3 and clear three lines with one piece. How many points is that?
type: text
answer: ["1500", "1,500"]
explain: Three lines are worth 500 × level = 500 × 3 = 1500.
```

```quiz
question: You have 38 lines and clear 2 more. What's your level afterwards?
options:
  - "4"
  - "5"
  - "40"
answer: 1
explain: 40 / 10 + 1 = 5. The level goes up each time you pass a multiple of ten lines.
```

```quiz
question: Why doesn't the level-up code need to change the gravity timer?
options:
  - Timers read the level automatically
  - Every new piece calls _restart_gravity(), which uses the current level
  - Gravity only depends on the score
answer: 1
```
