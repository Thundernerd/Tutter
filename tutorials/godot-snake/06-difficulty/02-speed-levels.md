---
title: Speed levels
description: Named starting speeds with an array and @export_enum.
estimatedMinutes: 10
---

"Starting speed 7.0" means little to a player. "Slow, Normal, Fast" means a lot. Let's offer three named levels.

## An array of speeds

Put the three speeds in an array, and pick one by its position (its **index**):

```gdscript title="game.gd" ins={2-3,9-10} del={7-8}
const START_CELL := Vector2i(8, 10)
## Moves per second at the start of a game, for each speed level.
const START_SPEEDS: Array[float] = [5.0, 7.0, 10.0]

## Leave the board on one side to come back on the other, instead of crashing.
@export var wrap_around := false
## Moves per second at the start of a game.
@export var start_speed := 7.0
## Index into START_SPEEDS.
@export_enum("Slow", "Normal", "Fast") var speed_level := 1
```

```gdscript title="game.gd" ins={3} del={2}
func _update_speed() -> void:
	var speed := minf(start_speed + score * SPEED_STEP, MAX_SPEED)
	var speed := minf(START_SPEEDS[speed_level] + score * SPEED_STEP, MAX_SPEED)
	move_timer.wait_time = 1.0 / speed
```

- `@export_enum("Slow", "Normal", "Fast")` turns an `int` into a dropdown in the Inspector. Picking "Slow" stores 0, "Normal" 1 and "Fast" 2.
- `START_SPEEDS[speed_level]` looks up the speed at that index: index 0 is 5.0, index 1 is 7.0, index 2 is 10.0.
- So the dropdown and the array line up by position. If you add a level, add it to both.

Select `Game`, pick **Fast** in the Inspector and play. That's a different game!

:::note[Why store an index?]
A small whole number is easy to show in a menu, easy to save to a file, and can't be set to a silly value like 7.000001 by accident. In chapter 8, `speed_level` moves to the options screen, and the code barely changes.
:::

```quiz
type: text
question: With `speed_level = 2`, what is `START_SPEEDS[speed_level]`?
answer: ["10", "10.0"]
explain: Indexes start at 0, so index 2 is the third value, 10.0.
```

```quiz
question: What does `@export_enum("Slow", "Normal", "Fast") var speed_level := 1` show in the Inspector?
options:
  - A number field with the value 1
  - A dropdown with "Normal" selected
  - Three checkboxes
answer: 1
```
