---
title: Moving and collisions
description: Asking the grid whether cells are free, and the try-then-commit pattern.
estimatedMinutes: 15
---

## Is this cell free?

All movement rules boil down to one question: *can the piece's four cells be where we want them?* A cell is free if it's inside the walls and empty. Add two functions to `board.gd`, after `_empty_row()`:

```gdscript title="board.gd"
## True if `cell` is inside the walls and not filled. Above the top is open space.
func is_free(cell: Vector2i) -> bool:
	if cell.x < 0 or cell.x >= COLUMNS or cell.y >= ROWS:
		return false
	if cell.y < 0:
		return true
	return rows[cell.y][cell.x] == EMPTY


## True if every cell of `test` is free.
func fits(test: Tetromino) -> bool:
	for cell in test.cells():
		if not is_free(cell):
			return false
	return true
```

The order of checks matters. Outside the side walls or below the floor is never free. Above the top edge (`y < 0`) is always free: that's open air, not a wall, which lets an `I` spawn with its box sticking out and lets pieces rotate near the top. Only then do we look at the grid, and only for cells that actually exist, since `rows[-1]` would quietly read the *last* row in GDScript.

## Try, then commit

How do you move a piece left? Not by moving it and then checking whether that was allowed. Instead, make a **copy** that's one column further left, ask the board if the copy fits, and only then make the copy the real piece. Add this to `tetromino.gd`, after `cells()`:

```gdscript title="tetromino.gd"
## A copy of this piece, moved by `offset` cells.
func moved(offset: Vector2i) -> Tetromino:
	return Tetromino.new(type, rotation, position + offset)
```

Because `moved()` returns a new piece instead of changing this one, a failed move leaves nothing to undo. We'll use the same pattern for falling and for rotating.

## Steering the piece

Now replace the temporary bag test in `game.gd` with left and right movement:

```gdscript title="game.gd" ins={18-22,29-38} del={15-17,28}
extends Node2D

## The falling piece.
var piece: Tetromino
var bag := PieceBag.new()

@onready var board: Board = $Board


func _ready() -> void:
	_spawn(bag.next())


func _unhandled_input(event: InputEvent) -> void:
	# Temporary: Space swaps in the next piece, so we can watch the bag at work.
	if event.is_action_pressed(&"hard_drop"):
		_spawn(bag.next())
	# Temporary: allow_echo lets the keyboard's own key repeat move a held piece.
	if event.is_action_pressed(&"move_left", true):
		_try_move(Vector2i.LEFT)
	elif event.is_action_pressed(&"move_right", true):
		_try_move(Vector2i.RIGHT)


func _spawn(piece_type: int) -> void:
	piece = Tetromino.spawn(piece_type, Board.COLUMNS)
	board.piece = piece
	print(Tetromino.Type.keys()[piece_type])


## Move the piece by `offset` if it fits there. Returns whether it moved.
func _try_move(offset: Vector2i) -> bool:
	var moved := piece.moved(offset)
	if not board.fits(moved):
		return false
	piece = moved
	board.piece = piece
	return true
```

- `Vector2i.LEFT` is `(-1, 0)` and `Vector2i.RIGHT` is `(1, 0)`. Later, `Vector2i.DOWN` (`(0, 1)`) makes the piece fall with the very same function.
- `_try_move` returns whether it worked. Movement ignores the answer, but gravity and locking will need it.
- Assigning `board.piece` triggers the setter we wrote earlier, so the board redraws.

:::note[allow_echo]
The second argument of `is_action_pressed(action, allow_echo)` lets through **echo** events: the repeated presses your operating system generates while a key is held. That gives us sliding for free, but its timing depends on the player's OS settings. The quality of life chapter replaces it with our own, configurable auto-repeat.
:::

Run the game and steer the piece left and right. It stops at the walls, and nothing else happens yet, because nothing pulls it down.

```quiz
question: A piece's cells include (-1, 5). What does `board.fits(piece)` return?
options:
  - "true: everything left of the board is open space"
  - "false: column -1 is outside the left wall"
  - It crashes with an index error
answer: 1
explain: '`is_free` checks the walls first. Only cells *above* the board (negative y) count as free.'
```

```quiz
question: Why does `_try_move` build a moved copy instead of changing `piece.position` directly?
options:
  - Changing position directly is not allowed in GDScript
  - So a move that doesn't fit leaves nothing to undo
  - Copies are faster
answer: 1
```
