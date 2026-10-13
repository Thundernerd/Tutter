---
title: The data model
description: A 2D array of cells, an enum for their state, and a class with no nodes at all.
estimatedMinutes: 20
---

## A grid is an array of arrays

A Minesweeper board is a grid: `width` columns and `height` rows. GDScript has no built-in 2D array, but an array *of arrays* does the job. The outer array holds the rows; each row holds its cells:

```text
            x=0  x=1  x=2  x=3
cells[0] = [ c ,  c ,  c ,  c ]   ← row y=0
cells[1] = [ c ,  c ,  c ,  c ]   ← row y=1
cells[2] = [ c ,  c ,  c ,  c ]   ← row y=2
```

So the cell in column `x`, row `y` is `cells[y][x]`. Rows first, like lines of text on a page. That order trips everyone up at least once, so we'll hide it behind a `get_cell(pos)` method and never write `cells[y][x]` anywhere else.

Positions are `Vector2i`: a pair of **integers**. `Vector2` (with floats) is for pixels; `Vector2i` is for grid coordinates, where "cell 2.5" makes no sense.

## What a cell needs to remember

| Field | Type | Meaning |
| --- | --- | --- |
| `state` | `CellState` | Hidden, revealed, flagged, or question-marked |
| `is_mine` | `bool` | Is there a mine under it? |
| `adjacent` | `int` | How many of its eight neighbours are mines (0–8) |

:::tip[One enum instead of several booleans]
You could store `is_revealed`, `is_flagged` and `is_questioned` as three booleans. But then a cell could be revealed *and* flagged at the same time, which makes no sense, and every piece of code would have to guard against it. A single `state` enum makes impossible combinations impossible to write.
:::

## The script

Create a new script (**File → New Script**, or right-click in the FileSystem dock) named `board_model.gd`. It isn't attached to any node:

```gdscript title="board_model.gd"
class_name BoardModel
extends RefCounted
## The rules of Minesweeper: a grid of cells, with no nodes and no drawing.

enum CellState { HIDDEN, REVEALED, FLAGGED, QUESTIONED }

var width: int
var height: int
var mine_count: int
var flags_placed := 0
## The grid, row by row: cells[y][x].
var cells: Array[Array] = []


class Cell:
	var state := CellState.HIDDEN
	var is_mine := false
	## How many of the eight neighbours are mines.
	var adjacent := 0

	## Hidden and question-marked cells can be revealed; flagged ones are protected.
	func can_reveal() -> bool:
		return state == CellState.HIDDEN or state == CellState.QUESTIONED


func _init(board_width: int, board_height: int, mines: int) -> void:
	width = board_width
	height = board_height
	mine_count = mines
	for y in height:
		var row: Array[Cell] = []
		for x in width:
			row.append(Cell.new())
		cells.append(row)


func get_cell(pos: Vector2i) -> Cell:
	return cells[pos.y][pos.x]


func is_inside(pos: Vector2i) -> bool:
	return pos.x >= 0 and pos.x < width and pos.y >= 0 and pos.y < height


func flags_left() -> int:
	return mine_count - flags_placed
```

There's a lot of new GDScript in a small space:

- **`class_name BoardModel`** registers a global type. Any script can now write `BoardModel.new(9, 9, 10)` or declare `var model: BoardModel`, without loading the file first.
- **`extends RefCounted`** instead of `Node`: the model isn't part of the scene tree, has no position, and doesn't need `_process`. A `RefCounted` object frees itself as soon as nothing refers to it anymore, so there's no `queue_free()` to forget.
- **`_init`** is the constructor. The arguments you pass to `BoardModel.new(...)` arrive here.
- **`class Cell:`** is an *inner class*, a small class that lives inside another script. Outside this file its full name is `BoardModel.Cell`.
- **`for y in height:`** counts from `0` to `height - 1`. The nested loops build one row at a time and append it to `cells`.
- **`Array[Array]`** and **`Array[Cell]`** are *typed arrays*. Godot checks what goes in, and the editor can autocomplete what comes out.

`QUESTIONED` is for the optional question marks we add in the options chapter. `can_reveal()` already accounts for it: a question mark is a note to yourself, not a protection, so you can still click it open. A flag *does* protect a cell.

:::note[Why not Nodes for cells?]
Each cell could be a node, but an expert board has 480 cells, and a cell has no position, no children and nothing to process. Plain objects in an array are lighter, and the model stays usable without any scene at all.
:::

```quiz
question: Which cell does `cells[2][5]` refer to?
options:
  - Column 2, row 5
  - Column 5, row 2
  - The 25th cell
answer: 1
explain: The outer array is the rows, so the first index is `y` (row 2) and the second is `x` (column 5). That's exactly why we hide it behind `get_cell(Vector2i(x, y))`.
```

```quiz
question: Why does `BoardModel` extend `RefCounted` instead of `Node`?
options:
  - RefCounted objects can't be freed by accident
  - It doesn't need to be in the scene tree, and it frees itself when no longer referenced
  - Nodes can't have inner classes
answer: 1
explain: The model is pure data and rules. It has no position, no children and no per-frame work, so it doesn't belong in the scene tree.
```

```quiz
question: A cell's `state` is `FLAGGED`. What does `can_reveal()` return?
type: text
answer: ["false"]
explain: Only `HIDDEN` and `QUESTIONED` cells can be revealed. Flags protect a cell from accidental clicks.
```
