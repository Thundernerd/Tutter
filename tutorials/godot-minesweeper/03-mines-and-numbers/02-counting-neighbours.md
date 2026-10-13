---
title: Counting neighbours
description: Eight offsets, bounds checks, and drawing coloured numbers.
estimatedMinutes: 20
---

Every safe cell shows how many of its eight neighbours are mines. That number is the whole game: it's the only information the player gets.

## The eight neighbours

The neighbours of a cell are one step away in any direction, diagonals included. As offsets from the cell:

```text
(-1,-1)  ( 0,-1)  ( 1,-1)
(-1, 0)   cell    ( 1, 0)
(-1, 1)  ( 0, 1)  ( 1, 1)
```

Not every cell has eight. Cells on the edge are missing a row or column of neighbours:

| Where | Neighbours |
| --- | --- |
| Corner | 3 |
| Edge (not corner) | 5 |
| Middle | 8 |

So the code adds each offset to the position and keeps only the results that are still on the board. Add the offsets as a constant near the top of `board_model.gd`, and `neighbours` after `is_inside`:

```gdscript title="board_model.gd"
## The eight steps from a cell to its neighbours.
const NEIGHBOUR_OFFSETS: Array[Vector2i] = [
	Vector2i(-1, -1), Vector2i(0, -1), Vector2i(1, -1),
	Vector2i(-1, 0), Vector2i(1, 0),
	Vector2i(-1, 1), Vector2i(0, 1), Vector2i(1, 1),
]


## The (up to eight) cells around `pos` that are on the board.
func neighbours(pos: Vector2i) -> Array[Vector2i]:
	var result: Array[Vector2i] = []
	for offset in NEIGHBOUR_OFFSETS:
		var next := pos + offset
		if is_inside(next):
			result.append(next)
	return result
```

This one helper will do a lot of work: counting numbers, flood fill, chording and placing mines all need "the cells around this one". Writing the bounds check once means none of them can forget it.

:::danger[Out of bounds]
Without `is_inside`, asking for the neighbours of `(0, 0)` would call `get_cell(Vector2i(-1, -1))`. `cells[-1]` doesn't crash in GDScript: negative indexes count from the *end* of the array, so you'd silently read a cell on the opposite side of the board. That's the worst kind of bug: wrong numbers, no error.
:::

## Count once, after placing

Mines never move once they're placed, so we count every cell's neighbours once and store the result in `adjacent`:

```gdscript title="board_model.gd" ins={10,13-21}
## Scatter the mines over the board.
func place_mines() -> void:
	var candidates: Array[Vector2i] = []
	for y in height:
		for x in width:
			candidates.append(Vector2i(x, y))
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
```

Mine cells get a count too. It's never shown, but it's harmless, and skipping them would only add an `if`.

## Drawing numbers

Minesweeper numbers have traditional colours: 1 is blue, 2 green, 3 red, and so on. The classic 4 (navy) and 7 (black) would vanish on our dark background, so they're swapped for lighter colours:

| Number | Classic | Ours |
| --- | --- | --- |
| 1 | blue | `#5b9bff` |
| 2 | green | `#5fd35f` |
| 3 | red | `#ff6b6b` |
| 4 | navy | `#b48cff` (purple) |
| 5 | maroon | `#ffa94d` (orange) |
| 6 | teal | `#3fd0c9` |
| 7 | black | `#e6e6e6` (near white) |
| 8 | grey | `#9aa0a6` |

Add the colours and a text helper to `board.gd`, and draw the number for safe cells:

```gdscript title="board.gd" ins={1-6,13-14,17-23}
## Text colours for 1 to 8 (index 0 is unused).
const NUMBER_COLORS: Array[Color] = [
	Color.TRANSPARENT,
	Color("5b9bff"), Color("5fd35f"), Color("ff6b6b"), Color("b48cff"),
	Color("ffa94d"), Color("3fd0c9"), Color("e6e6e6"), Color("9aa0a6"),
]

func _draw_cell(pos: Vector2i) -> void:
	# ...covered cells, unchanged...
	draw_rect(rect, COLOR_REVEALED)
	if cell.is_mine:
		_draw_mine(rect)
	elif cell.adjacent > 0:
		_draw_text(rect, str(cell.adjacent), NUMBER_COLORS[cell.adjacent])


func _draw_text(rect: Rect2, text: String, color: Color) -> void:
	var font := get_theme_default_font()
	var font_size := int(cell_size * 0.7)
	# draw_string positions the baseline, so centre the font's ascent and descent around the middle.
	var baseline := rect.get_center().y + (font.get_ascent(font_size) - font.get_descent(font_size)) / 2
	var origin := Vector2(rect.position.x, baseline)
	draw_string(font, origin, text, HORIZONTAL_ALIGNMENT_CENTER, rect.size.x, font_size, color)
```

Putting `Color.TRANSPARENT` at index 0 means `NUMBER_COLORS[n]` is the colour for `n`, with no `n - 1` to get wrong. Zeros are simply not drawn: an empty revealed cell *means* zero.

`draw_string` is the only fiddly part. Its position is the **baseline**: the line letters sit on, not their top or centre.

```text
       ┌──────────────┐ ← top of the cell
ascent │      ██      │
       │     ███      │
       │      ██      │ ← cell centre
       │      ██      │
       │    ██████    │ ← baseline
descent│              │ (room for letters like g and y)
       └──────────────┘
```

To centre a number vertically, put the baseline half of `ascent - descent` below the centre. Horizontally, `draw_string` can centre the text for us inside a given width (`HORIZONTAL_ALIGNMENT_CENTER` over `rect.size.x`). The font is the theme's default font, at 70% of the cell size, so the numbers scale with the board.

Run it. Revealed cells now show numbers, and you can start reasoning about where the mines are. It's still unfair, though: your very first click is a blind guess that can hit a mine.

```quiz
question: How many neighbours does the cell at `(8, 0)` have on a 9×9 board?
type: text
answer: ["3", "three"]
hint: x = 8 is the last column, y = 0 is the first row.
explain: It's the top-right corner. Only (7, 0), (7, 1) and (8, 1) are on the board.
```

```quiz
question: What would `cells[-1]` return in GDScript?
options:
  - An error
  - "null"
  - The last element of the array
answer: 2
explain: Negative indexes count from the end. That's why every neighbour lookup goes through `is_inside` instead of trusting the index to fail.
```

```quiz
question: Why is `NUMBER_COLORS[0]` set to `Color.TRANSPARENT`?
options:
  - So that index n is the colour for number n
  - Zeros are drawn invisibly on purpose
  - Arrays can't start with a real colour
answer: 0
explain: Zeros are never drawn at all. The placeholder just keeps the indexes lined up with the numbers.
```
