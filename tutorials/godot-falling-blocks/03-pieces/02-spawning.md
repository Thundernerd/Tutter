---
title: Spawning a piece
description: Where new pieces appear, and teaching the board to draw the falling piece.
estimatedMinutes: 15
---

## Where pieces appear

New pieces appear at the top, centred. Centring depends on the box: a 3-wide box in a 10-wide well can't be exactly in the middle, and by convention it leans left (columns 3 to 5). The `I` and `O` boxes are even, so they centre exactly.

| Type | Box | Box column | Cells |
| --- | --- | --- | --- |
| `I` | 4 | (10 − 4) / 2 = **3** | columns 3–6 |
| `O` | 2 | (10 − 2) / 2 = **4** | columns 4–5 |
| others | 3 | ⌊(10 − 3) / 2⌋ = **3** | columns 3–5 |

The `I`'s cells are in row 1 of its box, so we start its box one row *above* the board (`y = -1`) to make it appear in the top row like the others. Add a static helper to `tetromino.gd`, right after `_init`:

```gdscript title="tetromino.gd"
## A new piece in spawn rotation, centred at the top of a board `columns` wide.
static func spawn(piece_type: int, columns: int) -> Tetromino:
	var size := SIZES[piece_type]
	# The I piece sits in the second row of its box: lift it so it starts on row 0.
	var top := -1 if piece_type == Type.I else 0
	return Tetromino.new(piece_type, 0, Vector2i(floori((columns - size) / 2.0), top))
```

Dividing by `2.0` instead of `2` makes it a float division, and `floori` rounds down to a whole number: 3.5 becomes 3. Dividing two integers would round down too, but Godot warns about integer division because it's a classic source of bugs, so we say what we mean.

:::note[Above the board]
That `I` box at `y = -1` is our first hint that the space above the board matters. Its empty top row is outside the well, which is fine: in the next chapter we'll treat everything above the top edge as open air.
:::

## Drawing the falling piece

The board should draw the piece that's falling, on top of the locked blocks. Give it a `piece` property with a **setter**, and use the real colours and the new block style. Remove the test blocks from the previous page if you haven't yet:

```gdscript title="board.gd" ins={3-7,24-29,35-36} del={23,34}
## rows[y][x] is EMPTY or the Tetromino.Type that filled the cell. Row 0 is the top.
var rows: Array[Array] = []
## The falling piece, drawn on top of the locked blocks. null between pieces.
var piece: Tetromino:
	set(value):
		piece = value
		queue_redraw()

# ...

func _draw() -> void:
	var well := Rect2(0, 0, COLUMNS * CELL_SIZE, ROWS * CELL_SIZE)
	draw_rect(well.grow(2), FRAME_COLOR)
	draw_rect(well, BACKGROUND_COLOR)
	for x in range(1, COLUMNS):
		draw_line(Vector2(x * CELL_SIZE, 0), Vector2(x * CELL_SIZE, well.size.y), GRID_COLOR)
	for y in range(1, ROWS):
		draw_line(Vector2(0, y * CELL_SIZE), Vector2(well.size.x, y * CELL_SIZE), GRID_COLOR)

	for y in ROWS:
		for x in COLUMNS:
			if rows[y][x] != EMPTY:
				_draw_cell(Vector2i(x, y), Color.WHITE)
				_draw_cell(Vector2i(x, y), Tetromino.COLORS[rows[y][x]])

	if piece:
		var color := Tetromino.COLORS[piece.type]
		for cell in piece.cells():
			_draw_cell(cell, color)

# ...

func _draw_cell(cell: Vector2i, color: Color) -> void:
	draw_rect(_cell_rect(cell).grow(-1), color)
	if cell.y >= 0: # Cells above the board stay hidden.
		Tetromino.draw_block(self, _cell_rect(cell), color)
```

The setter runs every time anything assigns `board.piece = ...`. It stores the value and asks for a redraw, so the rest of the game never has to remember to call `queue_redraw()` after moving a piece. The `if cell.y >= 0` check hides cells above the well instead of drawing them over the frame.

## The game script

Attach a script to the `Game` node:

```gdscript title="game.gd"
extends Node2D

## The falling piece.
var piece: Tetromino

@onready var board: Board = $Board


func _ready() -> void:
	_spawn(Tetromino.Type.values().pick_random())


func _spawn(piece_type: int) -> void:
	piece = Tetromino.spawn(piece_type, Board.COLUMNS)
	board.piece = piece
```

- `@onready` fills the variable just before `_ready()` runs, once the child nodes exist. `$Board` is shorthand for `get_node("Board")`.
- Because `board.gd` has `class_name Board`, we can type the variable as `Board` and read constants straight from the class: `Board.COLUMNS`.
- `Tetromino.Type.values()` is the array `[0, 1, 2, 3, 4, 5, 6]`, and `pick_random()` picks one.

Run the game a few times: a random piece appears at the top of the well each time.

```quiz
question: What does the `piece` setter in board.gd do besides storing the value?
options:
  - Moves the piece down
  - Calls queue_redraw(), so the board redraws whenever the piece changes
  - Checks whether the piece fits
answer: 1
```

```quiz
question: Which columns does a freshly spawned O piece cover?
options:
  - 3 and 4
  - 4 and 5
  - 5 and 6
answer: 1
explain: The O's box is 2 wide, so it starts at column (10 − 2) / 2 = 4 and covers columns 4 and 5.
```
