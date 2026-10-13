---
title: A grid as data
description: Why there are no physics bodies, and how rows of numbers describe the board.
estimatedMinutes: 15
---

## Why not physics?

It's tempting to make every block a `StaticBody2D` and every piece a `CharacterBody2D`, but grid rules and physics fight each other:

| Question | With physics | With a grid |
| --- | --- | --- |
| Can the piece move left? | Move it, check for collisions, undo | Are the cells to the left empty? |
| Is a row full? | Count bodies in an area | Does the row contain an empty cell? |
| Clear a row | Free bodies, move every body above down | Remove one array entry |
| Rotate near a wall | Shapes overlap mid-rotation | Try the new cells, keep them if they're free |

So there are no collision layers to set up in this project, and no physics bodies at all. Everything that matters is in an array we fully control, which also makes the rules easy to test.

## The data

The board is 10 columns by 20 rows, the classic size. We store it as an array of **rows**, top to bottom, and each row is an array of 10 numbers:

```text
rows[0]  = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1]   ← top
rows[1]  = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1]
...
rows[18] = [-1,  2, -1, -1, -1, -1, -1, -1, -1, -1]
rows[19] = [ 2,  2,  2, -1, -1, -1,  0,  0,  0,  0]   ← bottom
```

`-1` means empty. Any other number is the **type** of the piece that left a block there (0 to 6, one per piece; the next chapter defines them). We keep the type rather than just "filled" so each block can be drawn in its piece's colour.

`rows[y][x]` reads naturally as "row y, column x", with y growing downwards just like Godot's 2D coordinates. Storing rows (instead of columns) pays off in the line clearing chapter: removing a full row is a single `remove_at`.

## Fitting it into 640×360

Each cell is 16×16 pixels, so the well is 160×320. That leaves room on both sides for the hold box, the score and the next pieces, and 20 pixels above and below:

| Thing | Value |
| --- | --- |
| Cell size | 16 px |
| Well size | 10 × 16 = **160** px wide, 20 × 16 = **320** px tall |
| Well position | x = (640 − 160) / 2 = **240**, y = (360 − 320) / 2 = **20** |
| Space for the HUD | 240 px on each side |

## The Board node

Open `game.tscn` and add a `Node2D` child named `Board` at position **(240, 20)**. Everything the board draws will be relative to that corner, so cell (0, 0) is drawn at (0, 0) inside the board, not at the screen's corner.

Attach a new script, `board.gd`:

```gdscript title="board.gd"
class_name Board
extends Node2D
## The playfield: which cells are filled, and drawing everything on it.

const COLUMNS := 10
const ROWS := 20
const CELL_SIZE := 16
const EMPTY := -1

## rows[y][x] is EMPTY or the Tetromino.Type that filled the cell. Row 0 is the top.
var rows: Array[Array] = []


func _ready() -> void:
	for y in ROWS:
		rows.append(_empty_row())


func _empty_row() -> Array:
	var row := []
	row.resize(COLUMNS)
	row.fill(EMPTY)
	return row
```

- **`class_name Board`** registers the script as a global type. Other scripts can now write `Board.COLUMNS` or declare `var board: Board`, and get autocompletion for everything in it.
- **`Array[Array]`** is a *typed array*: Godot will complain if anything other than an array is added to `rows`. Arrays can't be typed two levels deep (`Array[Array[int]]` isn't allowed), so the rows themselves are plain arrays.
- **`resize` + `fill`** makes a row of 10 `EMPTY` values in two calls.
- Comments starting with `##` are **documentation comments**. They show up when you hover a name in the editor, and in the built-in help.

```quiz
question: After `_ready()`, what is `rows[19][0]`?
options:
  - "0"
  - "-1"
  - "null"
answer: 1
explain: Every cell starts as `EMPTY`, which is `-1`. Row 19 is the bottom row, column 0 the leftmost.
```

```quiz
question: Where on the screen is the top-left corner of cell (2, 3) drawn?
options:
  - (32, 48)
  - (272, 68)
  - (48, 32)
answer: 1
hint: The board starts at (240, 20) and each cell is 16 px.
explain: x = 240 + 2 × 16 = 272 and y = 20 + 3 × 16 = 68.
```
