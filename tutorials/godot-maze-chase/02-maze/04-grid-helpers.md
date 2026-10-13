---
title: Cells and pixels
description: The handful of helpers the player and the ghosts use to find their way.
estimatedMinutes: 15
---

The player and the ghosts move in pixels, but they *decide* in cells: "is the cell to my left open?", "which cell is closest to my target?". This page adds the helpers that translate between the two, plus the tunnel.

## The helpers

```gdscript title="maze.gd"
func is_open(cell: Vector2i) -> bool:
	return _char_at(cell) not in ["#", "-"]


func is_tunnel(cell: Vector2i) -> bool:
	return _char_at(cell) == "t"


func pos_to_cell(pos: Vector2) -> Vector2i:
	return Vector2i((pos / TILE).floor())


func cell_center(cell: Vector2i) -> Vector2:
	return Vector2(cell * TILE) + Vector2(TILE, TILE) / 2


## The next tile centre reached when moving from `pos` in `direction`.
func next_center(pos: Vector2, direction: Vector2i) -> Vector2:
	var center := cell_center(pos_to_cell(pos))
	if (center - pos).dot(Vector2(direction)) <= 0.0:
		# Already at (or past) this tile's centre: aim for the next tile.
		center += Vector2(direction * TILE)
	return center


## Moves a position that left through one end of the tunnel to the other end.
func wrap_position(pos: Vector2) -> Vector2:
	var cell := pos_to_cell(pos)
	if cell.x < -1:
		pos.x += (grid_size.x + 3) * TILE
	elif cell.x > grid_size.x:
		pos.x -= (grid_size.x + 3) * TILE
	return pos
```

(`cell_center` is already there from the first page; it's repeated here because it belongs with the others.)

### Pixels to cells and back

All positions are relative to the maze's top-left corner, so a position of `(37, 12)` is in cell `(3, 1)`: divide by 10 and round *down*. `floor()` matters for negative positions: `-3 / 10` must land in cell `-1`, not `0`, or the tunnel would misbehave.

A cell's centre is its corner plus half a tile: cell `(3, 1)` has its centre at `(35, 15)`.

:::note[TileMapLayer can do this too]
`TileMapLayer.local_to_map()` and `map_to_local()` do the same conversions. We use our own versions because they're one line each, work without a reference to a layer, and make the maths visible.
:::

### The next centre

`next_center` answers: "moving from here in this direction, which tile centre do I reach first?". The **dot product** of "vector to this tile's centre" and the direction tells us which side of the centre we're on:

```text
moving right →
   ●───────┼───────●      ● = tile centres
       ↑   │                dot > 0: the centre is still ahead → aim for it
     you   │                dot ≤ 0: you're on it or past it → aim one tile further
```

When the actor stands exactly on a centre, the dot product is 0 and the answer is the *next* centre, so it never gets stuck aiming at the spot it's already on.

### The tunnel

Row 14 has `t` cells at both ends. Thanks to `_char_at` repeating each row's edge character, `is_open` says the tunnel carries on outside the maze: cells `-1`, `-2` and so on are all open. Every other row's edge is `#`, so those rows stay closed.

`wrap_position` makes the tunnel loop. Once an actor reaches cell `-2` (two cells outside the left edge), it's moved `28 + 3 = 31` cells to the right, to cell `29`, two cells outside the right edge. Because both spots are off the maze, the jump is invisible; in the next chapter the HUD covers the area outside the maze anyway.

```quiz
question: Which cell is the pixel position `(-3, 145)` in?
options:
  - (0, 14)
  - (-1, 14)
  - (-0.3, 14.5)
answer: 1
explain: '`floor(-0.3)` is -1. Rounding towards zero would give 0, and actors would wobble at the tunnel entrance.'
```

```quiz
question: An actor is exactly on the centre of cell (5, 4), moving up. What does `next_center` return?
options:
  - The centre of (5, 4)
  - The centre of (5, 3)
  - The centre of (5, 5)
answer: 1
explain: On the centre, the dot product is 0, so it aims one tile further in the direction of travel. Up is -y, so that's (5, 3), at pixel (55, 35).
```

Next up: [the player](../03-player/01-player-scene.md).
