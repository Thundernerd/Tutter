---
title: Cells and pixels
description: Two coordinate systems, and a Board script that converts between them.
estimatedMinutes: 15
---

## Two ways to say "where"

Everything in Snake lives in a **cell** of the grid: the head is in cell (8, 10), the food in cell (20, 4). Godot, on the other hand, draws in **pixels**. Keeping the two apart makes the game much simpler to write:

| | Cells | Pixels |
| --- | --- | --- |
| Example | (8, 10) | (128.0, 160.0) |
| Type | `Vector2i` (whole numbers) | `Vector2` (decimals) |
| Used for | All the game rules: moving, eating, crashing | Only for drawing |

`Vector2` and `Vector2i` both hold an x and a y. The `i` stands for *integer*: whole numbers only, which is exactly what grid cells are. Comparing cells is then always exact; there's no "almost the same cell".

## The board

Our board has 36 columns and 20 rows of 16-pixel cells, which is 576×320 pixels. It sits 32 pixels from the top-left corner of the 640×360 screen, which leaves a strip at the top for the score:

```text
(0,0) ────────────────────────────────────────────── 640
  │  Score: 3                                Best: 12
  │    ┌───────────────────────────────────────────┐   ← y 32
  │    │ (0,0)  (1,0)  (2,0)  ...          (35,0)  │
  │    │ (0,1)                                     │
  │    │  ...           cells, 16×16 px            │
  │    │ (0,19)                           (35,19)  │
  │    └───────────────────────────────────────────┘   ← y 352
 360   ↑ x 32                                   x 608 ↑
```

Columns count from 0 to 35 and rows from 0 to 19: in programming, counting usually starts at 0.

Converting a cell to pixels is a multiplication: cell (3, 2) starts at 3 × 16 = 48 pixels across and 2 × 16 = 32 pixels down. Its centre is half a cell further, at (56, 40).

## The Board node

Open `game.tscn`, select `Game`, and add a child node (the **+** button in the Scene dock, or <kbd>Ctrl</kbd>+<kbd>A</kbd>): a `Node2D` named `Board`. In the Inspector, set its **Transform → Position** to (32, 32).

```text
Game (Node2D)
└── Board (Node2D)   # position (32, 32)
```

A child's position is measured from its **parent**. So everything we put inside `Board` later uses board coordinates: (0, 0) is the board's top-left corner, wherever the board is on screen. Move the board, and everything on it moves along.

## Your first script

A **script** gives a node behaviour. Right-click `Board`, choose **Attach Script**, keep the language on GDScript, name it `board.gd` and click **Create**. The script editor opens. Replace its contents with:

```gdscript title="board.gd"
class_name Board
extends Node2D
## The playing field. Knows the size of the grid and how grid cells map to pixels.

## The size of one cell, in pixels.
const CELL_SIZE := 16
## Number of columns (x) and rows (y).
const GRID_SIZE := Vector2i(36, 20)


## The pixel rectangle covered by a cell, relative to the board.
static func cell_rect(cell: Vector2i) -> Rect2:
	return Rect2(Vector2(cell * CELL_SIZE), Vector2(CELL_SIZE, CELL_SIZE))


## The pixel position of a cell's centre, relative to the board.
static func cell_center(cell: Vector2i) -> Vector2:
	return cell_rect(cell).get_center()
```

There's a lot of new syntax here, so line by line:

- `extends Node2D` says this script adds to a `Node2D`. Every script starts like this.
- `class_name Board` gives the script a global name. Any other script can now write `Board.CELL_SIZE` or `Board.cell_rect(...)`.
- `##` starts a **documentation comment**, shown when you hover over the name in the editor. A single `#` is a normal comment. Godot ignores both when running.
- `const` declares a **constant**, a value that never changes. `:=` lets Godot work out the type from the value: `16` is an `int`, `Vector2i(36, 20)` a `Vector2i`.
- `func` declares a **function**. `cell: Vector2i` means it takes one cell, and `-> Rect2` that it gives back (*returns*) a `Rect2`, a rectangle with a position and a size.
- `static` means the function doesn't need a `Board` node to work, only the constants. Other scripts can call `Board.cell_center(cell)` without finding the board first.
- **Indentation matters.** The lines inside a function are indented with one tab. That's how GDScript knows where a function ends.

`cell * CELL_SIZE` multiplies both x and y, which gives another `Vector2i`. Wrapping it in `Vector2(...)` turns it into a pixel position. `get_center()` returns the middle of the rectangle.

:::tip[Hover and Ctrl+click]
Hover over any built-in name like `Rect2` or `get_center` in the script editor to see what it does. <kbd>Ctrl</kbd>+click (<kbd>Cmd</kbd>+click on macOS) opens the full documentation page.
:::

Run the game: still an empty window. The board knows how big it is, but doesn't draw anything yet. That's the next page.

```quiz
question: Which pixel position does `Board.cell_rect(Vector2i(3, 2)).position` give?
options:
  - (3, 2)
  - (48, 32)
  - (56, 40)
  - (80, 64)
answer: 1
explain: Each cell is 16 pixels, so the top-left corner is (3 × 16, 2 × 16) = (48, 32), relative to the board. (56, 40) is the cell's centre.
```

```quiz
type: text
question: What is the column number of the rightmost column on our 36-column board?
answer: ["35"]
hint: The first column is number 0.
explain: Counting from 0, 36 columns are numbered 0 to 35.
```
