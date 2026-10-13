---
title: Lanes and corner sliding
description: Keep bombers centred in their lane and slide them around corners they'd otherwise snag on.
estimatedMinutes: 25
---

Real grid games cheat in the player's favour. Two small rules make movement feel smooth instead of fiddly:

1. **Lane centring.** While you move along a corridor, the game quietly pulls you towards its middle line.
2. **Corner sliding.** If you push against a wall but you're mostly past a corner, the game slides you around it into the open corridor.

## The geometry

Think of each row and column of cells as a **lane**. A bomber moving right is in a horizontal lane, and only its vertical position matters for corners: we call that the **side axis**. Its distance from the lane's centre line, along the side axis, is its **offset**.

Here's the situation corner sliding is for:

```text
         column 1   column 2
        ┌────────┬────────┐
 row 1  │        │ ●      │   you: in column 2, 8 px left of its centre, pressing ↓
        ├────────┼────────┤
 row 2  │  open  │████████│   below you: a pillar; below-left: open floor
        └────────┴────────┘
```

You're walking along row 1 and press ↓ while 8 pixels left of column 2's centre line. The nearest cell is column 2, row 1, and the cell below it is a pillar: blocked. But the cell to your left, and the one below *that*, are open. You're clearly leaning towards column 1, so the game should slide you left into column 1 and let you go down.

## The code

Swap the plain `velocity = input_direction * speed` for a method that knows about lanes:

```gdscript title="bomber.gd" ins={1,3}
func _physics_process(delta: float) -> void:
	input_direction = _read_direction()
	velocity = _lane_velocity(input_direction, delta)
	move_and_slide()
	_animate(input_direction)
```

```gdscript title="bomber.gd"
## How far off-centre (in pixels) you must be to slide around a corner.
const CORNER_SLIDE := 6.0


## Move along the grid: stay centred in the lane, and slide around corners.
func _lane_velocity(direction: Vector2, delta: float) -> Vector2:
	if direction == Vector2.ZERO:
		return Vector2.ZERO
	var cell := arena.cell_at(position)
	var step := Vector2i(direction)
	# The axis we're not moving along, and how far off-centre we are on it.
	var side_axis := Vector2(absf(direction.y), absf(direction.x))
	var offset := (position - arena.cell_center(cell)).dot(side_axis)
	if arena.is_free(cell + step):
		# The way ahead is open: go, while easing back into the middle of the lane.
		var correction := clampf(-offset / delta, -speed, speed)
		return (direction * speed + side_axis * correction).limit_length(speed)
	if absf(offset) > CORNER_SLIDE:
		# Blocked, but we're leaning towards a lane that is open: slide into it.
		var side := Vector2i(side_axis * signf(offset))
		if arena.is_free(cell + side) and arena.is_free(cell + side + step):
			return Vector2(side) * speed
	# Walk up to the obstacle; move_and_slide stops us there.
	return direction * speed
```

Put the constant at the top with `DIRECTIONS`. Step by step:

1. **`cell`** is the cell containing the bomber's centre, and `step` the direction as a `Vector2i`, so `cell + step` is the cell ahead.
2. **`side_axis`** swaps the direction's components and takes their absolute value. Moving left or right, it's `(0, 1)`; moving up or down, `(1, 0)`.
3. **`offset`** uses a dot product to measure the distance from the centre *only along the side axis*. Moving right and 3 pixels below the centre line gives `3`; moving down and 8 pixels to the left gives `-8`.
4. **Open road:** move in `direction`, plus a `correction` along the side axis that cancels the offset. `-offset / delta` is exactly the speed that would remove the whole offset in one physics tick; `clampf` keeps it no faster than walking. `limit_length(speed)` stops the diagonal from being faster than walking straight.
5. **Corner slide:** blocked ahead, but leaning more than `CORNER_SLIDE` pixels towards a side? If that side cell is free *and* the cell ahead of it is free, walk sideways into that lane at full speed. A few frames later the bomber's centre crosses into the new lane, the road ahead is open, and rule 4 takes over.
6. Otherwise, walk at the obstacle. `move_and_slide()` stops us when we touch it, so you can still walk right up to a wall.

:::tip[Why only 6 pixels?]
`CORNER_SLIDE` is how far you must lean before you get slid. Too small, and pressing into a wall while nearly centred jerks you sideways into the next lane. Too big, and you have to be almost past the corner before it helps. A quarter of a tile feels right; try 2 and 10 to feel the difference.
:::

:::note[Physics is still in charge]
We only choose a *velocity*. Collisions are still handled by `move_and_slide()` against the tile collision we painted, so the lane code can't push a bomber through a wall even if it gets something wrong.
:::

Run the game and race around the pillars. Turning into side corridors now works even when you press the key a little early or late.

```quiz
question: A bomber is moving **down**. Its position is 5 pixels right of its cell's centre. What are `side_axis` and `offset`?
options:
  - side_axis (1, 0), offset 5
  - side_axis (0, 1), offset 5
  - side_axis (1, 0), offset -5
  - side_axis (0, 1), offset 0
answer: 0
explain: Moving down, the side axis is horizontal, `(1, 0)`. The dot product picks out the x part of the difference, which is +5.
```

```quiz
question: Pressing ↓, the bomber is 8 pixels **left** of centre, the cell below is a pillar, and both the cell to the left and the cell below-left are free. Which velocity does `_lane_velocity` return (speed 72)?
options:
  - (0, 72)
  - (-72, 0)
  - (72, 0)
  - (0, 0)
answer: 1
explain: Blocked ahead, |offset| = 8 > 6, and the left lane is open below, so it slides left at full speed.
```

```quiz
question: Why is the correction clamped to `speed`?
options:
  - Godot crashes on large velocities
  - "-offset / delta can be huge (8 px / 0.0167 s = 480 px/s), which would snap the bomber sideways faster than it can walk"
  - So the bomber never reaches the centre
answer: 1
```
