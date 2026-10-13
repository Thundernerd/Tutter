---
title: Ghost piece and hard drop
description: Showing where the piece will land, and dropping it there instantly.
estimatedMinutes: 15
---

Both features need the same answer: *how far can the piece fall from here?*

## Drop distance

Keep moving a copy down one row until it doesn't fit any more. Add this to `board.gd` after `fits()`:

```gdscript title="board.gd" ins={9-14}
## True if every cell of `test` is free.
func fits(test: Tetromino) -> bool:
	for cell in test.cells():
		if not is_free(cell):
			return false
	return true


## How many rows `test` can fall before it lands.
func drop_distance(test: Tetromino) -> int:
	var distance := 0
	while fits(test.moved(Vector2i(0, distance + 1))):
		distance += 1
	return distance
```

Each loop asks whether the piece fits `distance + 1` rows down, so it stops at the last row that fits. Twenty `fits()` checks at most is nothing for a computer, so we can afford to call this every time the board draws.

## The ghost piece

The **ghost** is a faint outline of the piece where it would land. It's drawn before the real piece, so when they overlap (the piece is already on the floor), the real piece covers it. Add a `show_ghost` switch below `piece` in `board.gd`, and draw the ghost:

```gdscript title="board.gd" ins={6-7,13-16,25-31}
## The falling piece, drawn on top of the locked blocks. null between pieces.
var piece: Tetromino:
	set(value):
		piece = value
		queue_redraw()
## Draw a preview of where the falling piece will land.
var show_ghost := true

# ...

	if piece:
		var color := Tetromino.COLORS[piece.type]
		if show_ghost:
			var ghost := piece.moved(Vector2i(0, drop_distance(piece)))
			for cell in ghost.cells():
				_draw_ghost_cell(cell, color)
		for cell in piece.cells():
			_draw_cell(cell, color)

# ...

func _draw_cell(cell: Vector2i, color: Color) -> void:
	if cell.y >= 0: # Cells above the board stay hidden.
		Tetromino.draw_block(self, _cell_rect(cell), color)


func _draw_ghost_cell(cell: Vector2i, color: Color) -> void:
	if cell.y >= 0:
		var rect := _cell_rect(cell).grow(-1)
		draw_rect(rect, Color(color, 0.15))
		draw_rect(rect, Color(color, 0.6), false, 1.0)
```

The ghost is just the same piece moved down by `drop_distance`, drawn as a translucent fill (15% opacity) with a 1 px outline (60% opacity). `Color(color, 0.15)` makes a copy of a colour with a different alpha. `draw_rect`'s third argument `false` draws the outline only, and the fourth sets the line width.

Since `drop_distance` reads the grid, the ghost is always correct after every move or rotation, without any bookkeeping: the board redraws whenever `piece` changes. `show_ghost` becomes an option in the options chapter.

## Hard drop

A **hard drop** sends the piece straight to the ghost's position and locks it immediately, no lock delay. It scores 2 points per row. In `game.gd`:

```gdscript title="game.gd" ins={3-4,8-14}
	elif event.is_action_pressed(&"rotate_ccw"):
		_rotate(-1)
	elif event.is_action_pressed(&"hard_drop"):
		hard_drop()

# ...

func hard_drop() -> void:
	var distance := board.drop_distance(piece)
	piece = piece.moved(Vector2i(0, distance))
	_add_score(distance * 2)
	_lock_piece()


func _lock_piece() -> void:
```

We set `piece` directly instead of going through `_set_piece()`: the piece is about to lock anyway, so there's no point starting the lock delay. `_lock_piece()` takes over from there exactly as if the lock timer had run out.

`hard_drop()` has no leading underscore because it's a perfectly good public action: an on-screen button for touch devices, or a test, could call it directly.

Run the game: the ghost shows where each piece will land, and <kbd>Space</kbd> slams it down.

```quiz
question: A piece's lowest cell is in row 10, and the column below it is empty down to the floor (row 19 is the last row). What's its drop distance?
type: text
answer: ["9", "nine"]
explain: It can move down to row 19, which is 9 rows below row 10.
```

```quiz
question: Why does hard_drop() not call _set_piece()?
options:
  - _set_piece() can't move pieces more than one row
  - The piece locks right away, so starting the lock delay would be pointless
  - _set_piece() only works for rotations
answer: 1
```
