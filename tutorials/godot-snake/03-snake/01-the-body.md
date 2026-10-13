---
title: The body
description: An array of cells, and drawing it.
estimatedMinutes: 15
---

## A list of cells

An **array** is an ordered list of values. The snake's body is an array of cells, starting with the head:

```text
body = [ (8, 10), (7, 10), (6, 10) ]
          head               tail

column:    6      7      8
         ┌──────┬──────┬──────┐
row 10   │ tail │      │ head │   →
         └──────┴──────┴──────┘
```

`body[0]` is the head, `body[1]` the cell right behind it, and so on. `body.size()` is the length of the snake.

## The Snake node

Add a `Node2D` named `Snake` as a child of **`Board`** (not `Game`), so it shares the board's coordinates. Attach a script, `snake.gd`:

```text
Game (Node2D)
├── Board (Node2D)
│   └── Snake (Node2D)
└── MoveTimer (Timer)
```

```gdscript title="snake.gd"
class_name Snake
extends Node2D
## The snake: a list of grid cells, head first.

const HEAD_COLOR := Color("b4f07a")
const BODY_COLOR := Color("5fcf6a")
const TAIL_COLOR := Color("2f7d5b")

## Grid cells from the head (index 0) to the tail.
var body: Array[Vector2i] = []


## Lay the snake out horizontally, head at `head`, facing right.
func reset(head: Vector2i, length: int) -> void:
	body.clear()
	for i in length:
		body.append(head - Vector2i(i, 0))
	queue_redraw()


func _draw() -> void:
	for i in body.size():
		var color := HEAD_COLOR
		if i > 0:
			color = BODY_COLOR.lerp(TAIL_COLOR, float(i) / body.size())
		draw_rect(Board.cell_rect(body[i]).grow(-1), color)
```

- `Array[Vector2i]` is a **typed array**: it only accepts `Vector2i` values, and Godot warns you if you try to put anything else in. `= []` starts it empty.
- `reset` builds the starting snake. With `head` = (8, 10) and `length` = 3, the loop runs for `i` = 0, 1, 2 and appends (8, 10), (7, 10) and (6, 10): each cell one further to the left.
- `queue_redraw()` asks for a fresh `_draw()`, since the body changed.
- `_draw` draws one square per cell. `Board.cell_rect` is the static function from the board, and `grow(-1)` shrinks each square by a pixel on every side, leaving a thin gap between segments.
- `if i > 0:` runs the indented line only for body segments, so the head keeps its bright colour.
- `lerp` (short for *linear interpolation*) blends two colours: 0.0 gives `BODY_COLOR`, 1.0 gives `TAIL_COLOR`, 0.5 something in between. The further back the segment, the darker it gets.

:::warning[Whole-number division]
`i / body.size()` divides two `int`s, and in GDScript that gives an `int` too: 1 / 3 is 0, not 0.33. Turning one side into a `float` (a decimal number) with `float(i)` gives the real answer. This catches everyone at least once.
:::

## Lay it out

The game decides where the snake starts. Update `game.gd`:

```gdscript title="game.gd"
extends Node2D

const START_LENGTH := 3
const START_CELL := Vector2i(8, 10)

@onready var snake: Snake = $Board/Snake
@onready var move_timer: Timer = $MoveTimer


func _ready() -> void:
	snake.reset(START_CELL, START_LENGTH)
	move_timer.start()


func _on_move_timer_timeout() -> void:
	pass # Moving comes next.
```

- `$Board/Snake` is a **node path**: the `Snake` child of the `Board` child.
- The type `Snake` comes from `class_name Snake` in `snake.gd`. With it, the editor autocompletes `snake.reset(...)` and warns about typos.
- `pass` means "do nothing". A function needs at least one line, and this one gets real work on the next page. We removed the tick counter; it did its job.

Run the game: a three-segment snake waits on the left side of the board, bright head on the right.

```quiz
type: text
question: In GDScript, what is `7 / 2`?
answer: ["3"]
hint: Both numbers are whole numbers (int).
explain: Dividing two ints gives an int, rounded towards zero. `7 / 2.0` or `float(7) / 2` would give 3.5.
```

```quiz
question: What does `reset(Vector2i(5, 5), 4)` put in `body`?
options:
  - "[(5, 5), (6, 5), (7, 5), (8, 5)]"
  - "[(5, 5), (4, 5), (3, 5), (2, 5)]"
  - "[(5, 5), (5, 4), (5, 3), (5, 2)]"
answer: 1
explain: Each step subtracts `Vector2i(i, 0)` from the head, so the body trails off to the left of the head.
```
