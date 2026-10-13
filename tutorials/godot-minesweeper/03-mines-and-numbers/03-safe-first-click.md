---
title: A safe first click
description: Place the mines after the first click, track the game state, and end the game on a mine.
estimatedMinutes: 20
---

The first click in Minesweeper is a pure guess: there are no numbers yet to reason with. Losing on it isn't a mistake, it's bad luck, and it feels terrible. Every modern version protects you from it.

## Three ways to be fair

| Approach | First click guaranteed to... |
| --- | --- |
| Place mines at the start; if the first click hits one, move that mine elsewhere | ...not be a mine |
| Place mines **after** the first click, skipping the clicked cell | ...not be a mine |
| Place mines after the first click, skipping the clicked cell **and its neighbours** | ...be a `0`, which opens a whole region |

The third one is the friendliest: the first click always opens an area to work from (once flood fill exists, in the next chapter). We'll use it. Keeping 9 cells clear means a board can hold at most `width × height - 9` mines; we'll enforce that limit when players pick custom sizes.

## Game state

Placing mines on the first click means the model needs to know whether that click has happened yet. While we're at it, the game also needs to end when you hit a mine. Both are part of the **game state**:

| State | Meaning |
| --- | --- |
| `READY` | Board created, no click yet, no mines placed |
| `PLAYING` | Mines placed, game in progress |
| `WON` | Every safe cell revealed (chapter 5) |
| `LOST` | A mine was revealed |

Add the enum and a few fields at the top of `board_model.gd`:

```gdscript title="board_model.gd" ins={1,6,8-10}
enum GameState { READY, PLAYING, WON, LOST }
enum CellState { HIDDEN, REVEALED, FLAGGED, QUESTIONED }

# ...

var state := GameState.READY
var flags_placed := 0
var revealed_count := 0
## The mine that ended the game, or (-1, -1).
var exploded := Vector2i(-1, -1)
```

`revealed_count` will tell us when the board is cleared, and `exploded` remembers which mine you hit so the board can draw it in red. Add a helper after `flags_left`:

```gdscript title="board_model.gd"
func is_finished() -> bool:
	return state == GameState.WON or state == GameState.LOST
```

## Mines after the first click

Remove the temporary `place_mines()` call from `_init`, and give `place_mines` a cell to keep clear:

```gdscript title="board_model.gd" del={1,3,10} ins={2,4-6,11-14}
## Scatter the mines over the board.
## Scatter the mines anywhere except `safe` and the cells around it.
func place_mines() -> void:
func place_mines(safe: Vector2i) -> void:
	var keep_clear := neighbours(safe)
	keep_clear.append(safe)
	var candidates: Array[Vector2i] = []
	for y in height:
		for x in width:
			candidates.append(Vector2i(x, y))
			var pos := Vector2i(x, y)
			if pos not in keep_clear:
				candidates.append(pos)
	assert(candidates.size() >= mine_count, "Too many mines for this board")
	candidates.shuffle()
	for i in mine_count:
		get_cell(candidates[i]).is_mine = true
	_count_adjacent()
```

`neighbours()` pays off again: the clicked cell plus its neighbours is exactly the 3×3 block to keep clear (fewer cells at the edges, which only leaves more room for mines). `pos not in keep_clear` checks whether the array contains the position.

`assert` stops the game with a message if the condition is false. It's for **programmer** mistakes that should never happen in a finished game: the custom board screen will make it impossible to ask for too many mines, and this line catches us if we get that wrong. Asserts only run in debug builds; exported release games skip them.

Now `reveal` places the mines on the first call, and `_open` decides what happens to the clicked cell:

```gdscript title="board_model.gd" del={4,7-8} ins={5,9-12,16-25,28-31}
## Reveal a covered cell. Returns every cell that was revealed, in order.
func reveal(pos: Vector2i) -> Array[Vector2i]:
	var revealed: Array[Vector2i] = []
	if not get_cell(pos).can_reveal():
	if is_finished() or not get_cell(pos).can_reveal():
		return revealed
	get_cell(pos).state = CellState.REVEALED
	revealed.append(pos)
	if state == GameState.READY:
		place_mines(pos)
		state = GameState.PLAYING
	_open(pos, revealed)
	return revealed


## Reveal one cell the player chose. A mine ends the game.
func _open(pos: Vector2i, revealed: Array[Vector2i]) -> void:
	var cell := get_cell(pos)
	if cell.is_mine:
		cell.state = CellState.REVEALED
		revealed.append(pos)
		exploded = pos
		state = GameState.LOST
		return
	_reveal_one(pos, revealed)


func _reveal_one(pos: Vector2i, revealed: Array[Vector2i]) -> void:
	get_cell(pos).state = CellState.REVEALED
	revealed_count += 1
	revealed.append(pos)
```

Splitting the work into three functions looks like overkill for one cell, but each has a job that will grow:

- `reveal` is the **public** move: it checks the rules and handles the first click.
- `_open` handles one cell *the player chose*: a mine ends the game. Chording will call it too.
- `_reveal_one` flips a single safe cell and keeps the count. Flood fill will call it many times.

Finally, flags shouldn't change after the game ends either. Add the same check to the top of `toggle_flag`:

```gdscript title="board_model.gd" ins={2-3}
func toggle_flag(pos: Vector2i) -> bool:
	if is_finished():
		return false
	var cell := get_cell(pos)
```

## Show the mine you hit

One line in `board.gd` paints the fatal mine's background red:

```gdscript title="board.gd" ins={1,7} del={6}
const COLOR_EXPLODED := Color("c0392b")


func _draw_cell(pos: Vector2i) -> void:
	# ...covered cells, unchanged...
	draw_rect(rect, COLOR_REVEALED)
	draw_rect(rect, COLOR_EXPLODED if pos == model.exploded else COLOR_REVEALED)
```

Run it. The first click is always safe, and its 3×3 block is clear of mines (you'll see a `0`, an empty cell, wherever you click). Hit a mine later and it turns red, and the board stops accepting clicks.

## The model so far

Here's the complete `board_model.gd` at the end of this chapter, for comparison:

```gdscript title="board_model.gd"
class_name BoardModel
extends RefCounted
## The rules of Minesweeper: a grid of cells, with no nodes and no drawing.

enum GameState { READY, PLAYING, WON, LOST }
enum CellState { HIDDEN, REVEALED, FLAGGED, QUESTIONED }

## The eight steps from a cell to its neighbours.
const NEIGHBOUR_OFFSETS: Array[Vector2i] = [
	Vector2i(-1, -1), Vector2i(0, -1), Vector2i(1, -1),
	Vector2i(-1, 0), Vector2i(1, 0),
	Vector2i(-1, 1), Vector2i(0, 1), Vector2i(1, 1),
]

var width: int
var height: int
var mine_count: int
var state := GameState.READY
var flags_placed := 0
var revealed_count := 0
## The mine that ended the game, or (-1, -1).
var exploded := Vector2i(-1, -1)
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


## The (up to eight) cells around `pos` that are on the board.
func neighbours(pos: Vector2i) -> Array[Vector2i]:
	var result: Array[Vector2i] = []
	for offset in NEIGHBOUR_OFFSETS:
		var next := pos + offset
		if is_inside(next):
			result.append(next)
	return result


func flags_left() -> int:
	return mine_count - flags_placed


func is_finished() -> bool:
	return state == GameState.WON or state == GameState.LOST


## Scatter the mines anywhere except `safe` and the cells around it.
func place_mines(safe: Vector2i) -> void:
	var keep_clear := neighbours(safe)
	keep_clear.append(safe)
	var candidates: Array[Vector2i] = []
	for y in height:
		for x in width:
			var pos := Vector2i(x, y)
			if pos not in keep_clear:
				candidates.append(pos)
	assert(candidates.size() >= mine_count, "Too many mines for this board")
	candidates.shuffle()
	for i in mine_count:
		get_cell(candidates[i]).is_mine = true
	_count_adjacent()


func _count_adjacent() -> void:
	for y in height:
		for x in width:
			var pos := Vector2i(x, y)
			var count := 0
			for next in neighbours(pos):
				if get_cell(next).is_mine:
					count += 1
			get_cell(pos).adjacent = count


## Reveal a covered cell. Returns every cell that was revealed, in order.
func reveal(pos: Vector2i) -> Array[Vector2i]:
	var revealed: Array[Vector2i] = []
	if is_finished() or not get_cell(pos).can_reveal():
		return revealed
	if state == GameState.READY:
		place_mines(pos)
		state = GameState.PLAYING
	_open(pos, revealed)
	return revealed


## Flag a hidden cell, or unflag a flagged one.
func toggle_flag(pos: Vector2i) -> bool:
	if is_finished():
		return false
	var cell := get_cell(pos)
	match cell.state:
		CellState.HIDDEN:
			cell.state = CellState.FLAGGED
			flags_placed += 1
		CellState.FLAGGED:
			cell.state = CellState.HIDDEN
			flags_placed -= 1
		_:
			return false # Revealed cells can't be flagged.
	return true


## Reveal one cell the player chose. A mine ends the game.
func _open(pos: Vector2i, revealed: Array[Vector2i]) -> void:
	var cell := get_cell(pos)
	if cell.is_mine:
		cell.state = CellState.REVEALED
		revealed.append(pos)
		exploded = pos
		state = GameState.LOST
		return
	_reveal_one(pos, revealed)


func _reveal_one(pos: Vector2i, revealed: Array[Vector2i]) -> void:
	get_cell(pos).state = CellState.REVEALED
	revealed_count += 1
	revealed.append(pos)
```

```quiz
question: You click `(4, 4)` first on a 9×9 board. Which statements are now guaranteed? Select all that apply.
type: multiple
options:
  - "(4, 4) is not a mine"
  - "(5, 5) is not a mine"
  - "(4, 4) shows a 0"
  - "(6, 6) is not a mine"
answer: [0, 1, 2]
explain: The whole 3×3 block around the click is kept clear, so (4, 4) has no mines next to it, which makes it a 0. (6, 6) is two steps away and can be a mine.
```

```quiz
question: What's the maximum number of mines on a 9×9 board with this rule?
type: text
answer: ["72"]
hint: The worst case keeps a full 3×3 block clear.
explain: 81 cells minus the 9 kept clear by a click in the middle of the board leaves 72.
```

```quiz
question: Why does `reveal` check `is_finished()`?
options:
  - So that no moves are possible after winning or losing
  - To place the mines
  - It doesn't need to; the board checks it
answer: 0
explain: The rules belong in the model. Whatever calls `reveal` (mouse, keyboard, a test), the game can't continue after it ends.
```
