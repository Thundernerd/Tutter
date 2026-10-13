---
title: Drawing the board
description: A single Control that draws every cell itself, centred by a CenterContainer.
estimatedMinutes: 20
---

## Two ways to show a grid

Godot gives you two reasonable options for showing a grid of cells:

| | `GridContainer` of buttons | One custom-drawn `Control` |
| --- | --- | --- |
| How | One `Button` (or cell scene) per cell, laid out in N columns | One node that draws every cell in `_draw()` |
| Nodes on an expert board | 480 | 1 |
| Clicks | Each button reports its own `pressed` | The board turns a mouse position into a cell |
| Changing the look | A theme or a cell scene | Code: rectangles, lines, text |
| Good for | Inventories, level select screens, small grids | Big grids, game boards, anything you redraw often |

Both work for Minesweeper. We'll draw the board ourselves: it keeps the scene tree tiny, makes a 40×20 board as cheap as a 9×9 one, and teaches `_draw()`, which you'll use again for the smiley button and anywhere else a ready-made node doesn't fit.

## The scene

Open `game.tscn` and add two nodes:

```text
Game (Node)
└── BoardArea (CenterContainer)   # Anchor preset: Full Rect
    └── Board (Control, %)        # unique name; script board.gd
```

Select `BoardArea` and choose **Full Rect** in the toolbar's **Anchor preset** menu. A `CenterContainer` keeps its child centred, so the board stays in the middle of the screen whatever its size. To know that size, the container asks its child for its **minimum size**. Our board will set `custom_minimum_size` to the size of the grid in pixels, and the container does the rest.

Right-click `Board` and choose **Access as Unique Name**. The `%` next to it means scripts can find it as `%Board`, even if we move it around the tree later (and we will).

## Drawing with `_draw()`

Every `Control` and `Node2D` can draw shapes and text from code. Godot calls `_draw()` when the node first appears, and then only when you ask for it with `queue_redraw()`. Whatever `_draw()` draws stays on screen until the next redraw: you're not drawing every frame.

Attach a new script, `board.gd`, to `Board`:

```gdscript title="board.gd"
extends Control
## Draws a BoardModel and turns clicks into moves.

const COLOR_HIDDEN := Color("3d4663")
const COLOR_HIDDEN_EDGE := Color("56618a")
const COLOR_REVEALED := Color("1d2130")
const COLOR_FLAG := Color("ff5252")
const COLOR_POLE := Color("e8e8e8")

var model: BoardModel
var cell_size := 32


func setup(board_model: BoardModel, new_cell_size: int) -> void:
	model = board_model
	cell_size = new_cell_size
	custom_minimum_size = Vector2(model.width, model.height) * cell_size
	queue_redraw()


# --- Drawing ---------------------------------------------------------------

func _draw() -> void:
	if model == null:
		return
	for y in model.height:
		for x in model.width:
			_draw_cell(Vector2i(x, y))


## The visible square of a cell, leaving a 1px gap on every side.
func _cell_rect(pos: Vector2i) -> Rect2:
	return Rect2(Vector2(pos) * cell_size, Vector2(cell_size, cell_size)).grow(-1)


func _draw_cell(pos: Vector2i) -> void:
	var cell := model.get_cell(pos)
	var rect := _cell_rect(pos)
	if cell.state != BoardModel.CellState.REVEALED:
		_draw_covered(rect)
		if cell.state == BoardModel.CellState.FLAGGED:
			_draw_flag(rect)
		return
	draw_rect(rect, COLOR_REVEALED)


func _draw_covered(rect: Rect2) -> void:
	draw_rect(rect, COLOR_HIDDEN)
	# A lighter strip along the top makes the cell look raised.
	draw_rect(Rect2(rect.position, Vector2(rect.size.x, rect.size.y * 0.12)), COLOR_HIDDEN_EDGE)


## A point inside `rect`, given in fractions of its size: (0, 0) is top-left, (1, 1) bottom-right.
func _at(rect: Rect2, x: float, y: float) -> Vector2:
	return rect.position + rect.size * Vector2(x, y)


func _draw_flag(rect: Rect2) -> void:
	var line_width := maxf(1.0, cell_size * 0.08)
	draw_line(_at(rect, 0.4, 0.2), _at(rect, 0.4, 0.8), COLOR_POLE, line_width)
	draw_line(_at(rect, 0.25, 0.8), _at(rect, 0.65, 0.8), COLOR_POLE, line_width)
	var cloth := PackedVector2Array([_at(rect, 0.4, 0.2), _at(rect, 0.78, 0.35), _at(rect, 0.4, 0.5)])
	draw_colored_polygon(cloth, COLOR_FLAG)
```

Walking through it:

- **Cell to pixels.** Cell `(x, y)` starts at `(x, y) * cell_size`. With 32px cells, cell `(2, 1)` covers pixels 64–96 horizontally and 32–64 vertically. `grow(-1)` shrinks the rectangle by a pixel on every side, so neighbouring cells are separated by a 2px gap of background: that's the grid lines, for free.
- **The flag is described in fractions** of the cell. `_at(rect, 0.4, 0.2)` means "40% across, 20% down". The same numbers draw a correct flag at 32px, 20px or 15px per cell, which matters once boards get bigger.
- **`draw_colored_polygon`** fills any shape you give it as a list of points; three points make the flag's triangle.
- **`model == null`** happens for a moment: the editor and Godot both draw the node before `setup()` runs.

The board's own code never decides *what* a cell is; it only asks the model and draws the answer. Here's the flag, for reference:

| Part | Points (fractions of the cell) |
| --- | --- |
| Pole | (0.4, 0.2) to (0.4, 0.8) |
| Base | (0.25, 0.8) to (0.65, 0.8) |
| Cloth | triangle (0.4, 0.2), (0.78, 0.35), (0.4, 0.5) |

## Create the model

The game script creates a model and hands it to the board. Attach `game.gd` to `Game`:

```gdscript title="game.gd"
extends Node
## Runs one game: creates the model and hands it to the board.

var model: BoardModel

@onready var board: Control = %Board


func _ready() -> void:
	model = BoardModel.new(9, 9, 10)
	board.setup(model, 32)
```

9×9 cells with 10 mines is the classic *beginner* board. The mines don't exist yet; we place them in the next chapter.

Run the game. A 288×288 grid of raised blue cells sits in the middle of the window.

```quiz
question: When does Godot call a Control's `_draw()`?
options:
  - Every frame
  - When the node first appears, and after each `queue_redraw()`
  - Only in the editor
answer: 1
explain: Drawing is retained. What `_draw()` produced stays on screen until you call `queue_redraw()`, so an unchanged board costs nothing per frame.
```

```quiz
question: With `cell_size = 20`, where does cell `(3, 2)` start, in the board's pixels?
options:
  - (60, 40)
  - (40, 60)
  - (23, 22)
answer: 0
explain: x × 20 = 60 and y × 20 = 40. Then `grow(-1)` moves the visible square in by one pixel on each side.
```

```quiz
question: How does the CenterContainer know how big the board is?
options:
  - It measures what the board draws
  - From the board's minimum size, which `setup()` sets via `custom_minimum_size`
  - It always assumes 288×288
answer: 1
explain: Containers lay out children by their minimum size. A custom-drawn control has to tell the container how much room it needs.
```
