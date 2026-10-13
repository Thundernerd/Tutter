---
title: Rotation states
description: Four states per piece, and turning a cell a quarter turn inside its box.
estimatedMinutes: 20
---

## Four states

Every piece has four **rotation states**. We number them like the `rotation` variable already does: `0` is how the piece spawns, and each clockwise quarter turn adds one, wrapping from 3 back to 0. (Rotation system documents often call them 0, R, 2 and L.) Here's the T in all four:

```text
   state 0        state 1        state 2        state 3
    . # .          . # .          . . .          . # .
    # # #          . # #          # # #          # # .
    . . .          . # .          . # .          . # .
```

Notice the T turns around the **centre of its box**: the middle cell never moves. That's why we stored shapes inside square boxes: rotating the box rotates the piece in exactly the way players expect.

## A quarter turn, as maths

To turn a cell a quarter turn clockwise inside a box `size` cells wide:

```text
(x, y)  →  (size - 1 - y, x)
```

Try it on the T's top cell (1, 0) in a box of 3: it goes to (3 − 1 − 0, 1) = (2, 1), the right-hand cell of state 1. The left cell (0, 1) goes to (1, 0), the top. And the centre (1, 1) stays at (1, 1). Applying the formula twice gives state 2, three times gives state 3, and four times brings every cell home.

:::note[Why does this work?]
In screen coordinates (y pointing down), a clockwise quarter turn maps (x, y) to (−y, x). That turns around the box's top-left corner and would push the piece out of its box, so we add `size - 1` to slide it back in.
:::

## Rotated cells and rotated copies

Update `cells()` in `tetromino.gd` to apply the turn `rotation` times, and add a `rotated()` method that works like `moved()`: it returns a turned copy.

```gdscript title="tetromino.gd" ins={3,6-7,17-19}
## The board cells this piece covers.
func cells() -> Array[Vector2i]:
	var size := SIZES[type]
	var result: Array[Vector2i] = []
	for cell: Vector2i in SHAPES[type]:
		for turn in rotation:
			cell = Vector2i(size - 1 - cell.y, cell.x) # A quarter turn clockwise.
		result.append(position + cell)
	return result


## A copy of this piece, moved by `offset` cells.
func moved(offset: Vector2i) -> Tetromino:
	return Tetromino.new(type, rotation, position + offset)


## A copy of this piece, turned clockwise (1) or counter-clockwise (-1).
func rotated(direction: int) -> Tetromino:
	return Tetromino.new(type, wrapi(rotation + direction, 0, 4), position)
```

- `for turn in rotation` repeats the turn 0 to 3 times. `turn` itself isn't used; we only need the repetition.
- Assigning to the loop variable `cell` changes our copy of it, not the constant `SHAPES` array.
- **`wrapi(value, 0, 4)`** wraps a whole number into the range 0 to 3: `wrapi(4, 0, 4)` is 0, and `wrapi(-1, 0, 4)` is 3. One counter-clockwise turn from state 0 lands on state 3.

## Rotating in the game

In `game.gd`, react to the rotate actions and add a `_rotate()` function right after `_try_move()`:

```gdscript title="game.gd" ins={9-12,16-20}
func _unhandled_input(event: InputEvent) -> void:
	if piece == null:
		return
	# Temporary: allow_echo lets the keyboard's own key repeat move a held piece.
	if event.is_action_pressed(&"move_left", true):
		_try_move(Vector2i.LEFT)
	elif event.is_action_pressed(&"move_right", true):
		_try_move(Vector2i.RIGHT)
	elif event.is_action_pressed(&"rotate_cw"):
		_rotate(1)
	elif event.is_action_pressed(&"rotate_ccw"):
		_rotate(-1)

# ...

## Turn the piece if it fits in its new rotation.
func _rotate(direction: int) -> void:
	var turned := piece.rotated(direction)
	if board.fits(turned):
		_set_piece(turned)
```

Rotation goes through `_set_piece`, so turning a resting piece restarts the lock delay just like moving does.

Run the game and spin some pieces with <kbd>↑</kbd> and <kbd>Z</kbd>. Then stand an `I` piece upright, push it against the right wall and try to turn it back: nothing happens. Lying flat it would need columns 7 to 10, and column 10 doesn't exist. The same goes for many pieces near walls, the floor and other blocks. The next page fixes that.

```quiz
question: Using `(x, y) → (size - 1 - y, x)`, where does the I piece's cell (0, 1) go after one clockwise turn in its 4×4 box?
options:
  - (2, 0)
  - (1, 0)
  - (0, 2)
  - (3, 1)
answer: 0
explain: (4 − 1 − 1, 0) = (2, 0). All four cells of the flat I end up in column 2, standing upright.
```

```quiz
question: What is `wrapi(0 - 1, 0, 4)`?
type: text
answer: ["3"]
explain: '`wrapi` wraps values that fall outside the range around to the other end, so −1 becomes 3.'
```
