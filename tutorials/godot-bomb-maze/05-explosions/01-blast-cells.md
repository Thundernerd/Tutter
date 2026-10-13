---
title: Where the blast goes
description: Walking four arms out from the bomb, one cell at a time.
estimatedMinutes: 15
---

A blast is a cross: the bomb's own cell plus four **arms**, each up to `power` cells long. The rules:

- An arm stops **before** a wall: walls never burn.
- An arm stops **at** a block: the block burns, but nothing behind it does.
- Everything else (empty floor, bombers, bombs, power-ups) is in the blast.

Here is a bomb `B` with power 2. `*` is fire, `▓` a block that burns:

```text
   x: 0  1  2  3  4  5  6
y=0   #  #  #  #  #  #  #
y=1   #  .  .  ▓  .  .  #    the up arm stops at the block
y=2   #  .  #  *  #  .  #
y=3   #  *  *  B  *  *  #    left and right reach their full 2 cells
y=4   #  .  #  *  #  .  #
y=5   #  .  .  *  .  .  #
y=6   #  #  #  #  #  #  #
```

With power 3, the left arm would reach (0, 3), a wall, and stop at (1, 3) anyway.

## The code

This is pure grid logic, so it belongs in the arena. First, the four directions as a constant (next to the tile constants):

```gdscript title="arena.gd"
const DIRECTIONS: Array[Vector2i] = [Vector2i.UP, Vector2i.DOWN, Vector2i.LEFT, Vector2i.RIGHT]
```

Then the blast:

```gdscript title="arena.gd"
## Every cell a blast from `origin` reaches: the centre plus four arms of up to
## `power` cells. Arms stop before walls, and at the first block (which burns).
func blast_cells(origin: Vector2i, power: int) -> Array[Vector2i]:
	var cells: Array[Vector2i] = [origin]
	for direction in DIRECTIONS:
		for distance in range(1, power + 1):
			var cell := origin + direction * distance
			if is_wall(cell):
				break
			cells.append(cell)
			if is_block(cell):
				break
	return cells
```

`range(1, power + 1)` counts 1, 2, … `power`, so `direction * distance` walks outwards from the bomb. The two `break`s implement the two stopping rules: before appending for walls, after appending for blocks.

The function only *reports* cells; it doesn't change anything. That matters later: the CPU will call this same function to predict blasts, without blowing anything up.

```quiz
question: A power 2 bomb sits in the top-left corner cell (1, 1) of an empty arena. How many cells does its blast cover?
type: text
answer: ["5", "five"]
hint: Up and left are walls. What about down and right?
explain: (1, 1) itself, (1, 2) and (1, 3) going down, (2, 1) and (3, 1) going right. The pillar at (2, 2) isn't on either arm.
```

```quiz
question: Why does the arm check `is_wall` before appending the cell, but `is_block` after?
options:
  - It's arbitrary; either order works
  - Walls don't burn, so the wall cell is excluded; blocks do burn, so the block cell is included before the arm stops
  - is_block is slower, so it runs last
answer: 1
```
