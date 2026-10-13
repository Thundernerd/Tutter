---
title: Placing mines
description: Two ways to pick N random cells, and why shuffling wins.
estimatedMinutes: 15
---

We need to choose `mine_count` different cells at random. "Different" is the tricky part: picking the same cell twice would leave the board one mine short.

## Option 1: pick and retry

The obvious approach: pick a random cell; if it already has a mine, try again.

```gdscript
var placed := 0
while placed < mine_count:
	var pos := Vector2i(randi() % width, randi() % height)
	if not get_cell(pos).is_mine:
		get_cell(pos).is_mine = true
		placed += 1
```

On a beginner board (10 mines in 81 cells) this is fine: almost every pick hits an empty cell. But think about a crowded custom board, say 790 mines in 800 cells. Placing the last mine means hunting for one of the 11 remaining empty cells: on average 800 / 11 ≈ 73 tries, and in theory the loop could keep missing for any number of tries. There's no upper limit on how long it runs.

## Option 2: shuffle and take

A better idea: make a list of every cell, **shuffle** it, and put mines on the first `mine_count` entries.

```text
all cells:   (0,0) (1,0) (2,0) (3,0) (0,1) (1,1) ...
shuffled:    (2,1) (0,3) (3,0) (1,1) (0,0) (2,2) ...
              └──── first 10 get mines ────┘
```

Every cell appears exactly once in the list, so duplicates are impossible, and the work is always the same: one pass to build the list, one shuffle, one pass to place.

`Array.shuffle()` uses the **Fisher–Yates** algorithm: walk the array from the end, and swap each element with a random element at or before it. Every possible order is equally likely, so every cell has the same chance of getting a mine.

## The code

Add `place_mines` to `board_model.gd`:

```gdscript title="board_model.gd"
## Scatter the mines over the board.
func place_mines() -> void:
	var candidates: Array[Vector2i] = []
	for y in height:
		for x in width:
			candidates.append(Vector2i(x, y))
	candidates.shuffle()
	for i in mine_count:
		get_cell(candidates[i]).is_mine = true
```

For now, call it at the end of `_init` so the mines exist from the start:

```gdscript title="board_model.gd" ins={10}
func _init(board_width: int, board_height: int, mines: int) -> void:
	width = board_width
	height = board_height
	mine_count = mines
	for y in height:
		var row: Array[Cell] = []
		for x in width:
			row.append(Cell.new())
		cells.append(row)
	place_mines() # Temporary: the first click will do this instead (page 3).
```

## Drawing a mine

The board needs to draw what it finds under a revealed cell. Add a colour and a drawing function to `board.gd`, and use it in `_draw_cell`:

```gdscript title="board.gd" ins={1,7-8,11-19}
const COLOR_MINE := Color("c9cede")


func _draw_cell(pos: Vector2i) -> void:
	# ...covered cells, unchanged...
	draw_rect(rect, COLOR_REVEALED)
	if cell.is_mine:
		_draw_mine(rect)


func _draw_mine(rect: Rect2) -> void:
	var center := rect.get_center()
	var radius := rect.size.x * 0.22
	var line_width := maxf(1.0, cell_size * 0.07)
	for angle in [0.0, PI / 4, PI / 2, PI * 3 / 4]:
		var spike := Vector2.from_angle(angle) * radius * 1.5
		draw_line(center - spike, center + spike, COLOR_MINE, line_width)
	draw_circle(center, radius, COLOR_MINE)
	draw_circle(center - Vector2(radius, radius) * 0.35, radius * 0.25, Color.WHITE)
```

Four lines through the centre at 0°, 45°, 90° and 135° make eight spikes. `Vector2.from_angle(angle)` is a direction of length 1, scaled to 1.5× the radius so the spikes poke out of the body. A small white circle up and to the left adds a highlight.

Run the game and click around: some cells now reveal a mine. Nothing happens when you hit one yet, and empty cells don't tell you anything. Numbers come next.

```quiz
question: Why is "shuffle and take" better than "pick and retry"?
options:
  - It uses less memory
  - Its running time is fixed, no matter how crowded the board is
  - Random numbers are slow
answer: 1
explain: Retrying can take arbitrarily many attempts when few empty cells are left. Shuffling does the same amount of work every time and can never pick a cell twice.
```

```quiz
question: A board has 800 cells and 790 mines are already placed. With "pick and retry", roughly how many tries does the next mine take on average?
options:
  - "1"
  - About 10
  - About 80
  - About 790
answer: 2
explain: Only 10 of 800 cells are free, so each pick succeeds with probability 10/800 = 1/80. On average that's 80 tries.
```
