---
title: The seven tetrominoes
description: Shapes as cell lists inside a box, and a small class to hold one piece.
estimatedMinutes: 20
---

## The pieces

There are exactly seven ways to join four squares edge to edge (counting mirror images as different), and each has a letter it resembles and, by long convention, a colour:

| Type | Shape | Colour | Box |
| --- | --- | --- | --- |
| `I` | four in a row | cyan | 4×4 |
| `O` | 2×2 square | yellow | 2×2 |
| `T` | three with a bump in the middle | purple | 3×3 |
| `S` | two offset pairs, rising to the right | green | 3×3 |
| `Z` | two offset pairs, falling to the right | red | 3×3 |
| `J` | three with a hook up on the left | blue | 3×3 |
| `L` | three with a hook up on the right | orange | 3×3 |

## Shapes as data

We describe each shape as the four cells it covers inside a small square **box**. The box matters: in the rotation chapter, pieces turn around the centre of their box, so getting the boxes right now makes rotation almost free later.

```text
I (4×4)      O (2×2)   T (3×3)    S (3×3)    Z (3×3)    J (3×3)    L (3×3)
. . . .      # #       . # .      . # #      # # .      # . .      . . #
# # # #      # #       # # #      # # .      . # #      # # #      # # #
. . . .                . . .      . . .      . . .      . . .      . . .
. . . .
```

Read the `T` as cells (1, 0), (0, 1), (1, 1) and (2, 1): x is the column inside the box, y the row, and y grows downwards just like on the board. Note that the `I` sits in the *second* row of its box. That looks odd, but it's where the standard rotation rules expect it.

## The Tetromino class

Create a new script `tetromino.gd` that isn't attached to any node:

```gdscript title="tetromino.gd"
class_name Tetromino
extends RefCounted
## One piece: its type, rotation and position on the board.
## Also holds the shape, colour and wall kick data for all seven types.

enum Type { I, O, T, S, Z, J, L }

const COLORS: Array[Color] = [
	Color(0.25, 0.82, 0.88), # I: cyan
	Color(0.95, 0.83, 0.23), # O: yellow
	Color(0.65, 0.37, 0.88), # T: purple
	Color(0.36, 0.84, 0.36), # S: green
	Color(0.91, 0.32, 0.29), # Z: red
	Color(0.29, 0.49, 0.91), # J: blue
	Color(0.94, 0.6, 0.23), # L: orange
]

## The cells of each type in its spawn rotation, inside a square box
## SIZES[type] cells wide. x grows to the right, y grows downwards.
const SHAPES: Array = [
	[Vector2i(0, 1), Vector2i(1, 1), Vector2i(2, 1), Vector2i(3, 1)], # I
	[Vector2i(0, 0), Vector2i(1, 0), Vector2i(0, 1), Vector2i(1, 1)], # O
	[Vector2i(1, 0), Vector2i(0, 1), Vector2i(1, 1), Vector2i(2, 1)], # T
	[Vector2i(1, 0), Vector2i(2, 0), Vector2i(0, 1), Vector2i(1, 1)], # S
	[Vector2i(0, 0), Vector2i(1, 0), Vector2i(1, 1), Vector2i(2, 1)], # Z
	[Vector2i(0, 0), Vector2i(0, 1), Vector2i(1, 1), Vector2i(2, 1)], # J
	[Vector2i(2, 0), Vector2i(0, 1), Vector2i(1, 1), Vector2i(2, 1)], # L
]
const SIZES: Array[int] = [4, 2, 3, 3, 3, 3, 3]

## One of the Type values.
var type: int = Type.I
## 0 is the spawn rotation; 1, 2 and 3 are each a further quarter turn clockwise.
var rotation := 0
## The top-left corner of the piece's box, in board cells.
var position := Vector2i.ZERO


func _init(piece_type: int, piece_rotation := 0, piece_position := Vector2i.ZERO) -> void:
	type = piece_type
	rotation = piece_rotation
	position = piece_position


## The board cells this piece covers.
func cells() -> Array[Vector2i]:
	var result: Array[Vector2i] = []
	for cell: Vector2i in SHAPES[type]:
		result.append(position + cell)
	return result
```

A few things worth understanding:

- **`extends RefCounted`**, not `Node`. A piece is plain data: it doesn't need to be in the scene tree, process every frame or draw itself. `RefCounted` objects free themselves automatically once nothing refers to them, so we can create and throw away pieces freely.
- **`enum Type { I, O, T, S, Z, J, L }`** gives the numbers 0 to 6 readable names: `Tetromino.Type.T` is `2`. The board stores these numbers, and they double as indices into `COLORS`, `SHAPES` and `SIZES`.
- **One index, many arrays.** Everything about type 2 is at index 2: `COLORS[2]` is purple, `SHAPES[2]` is the T's cells, `SIZES[2]` is its box. Adding an eighth piece would mean adding one entry to each array.
- **`_init`** is the constructor: `Tetromino.new(Tetromino.Type.T)` makes a T with rotation 0 at (0, 0); the last two arguments are optional.
- **`cells()`** turns the shape into board coordinates by adding the piece's `position` to every cell. A T at position (3, 0) covers (4, 0), (3, 1), (4, 1) and (5, 1).

`rotation` is stored but not used yet; the rotation chapter brings it to life.

:::tip[Why `type: int` and not `type: Type`?]
Typing it as `Type` would make Godot warn every time we assign a plain number, and our numbers come from arrays and the board. Keeping it an `int` and using the enum names for readability is the pragmatic middle ground.
:::

## Drawing a block

The board and, later, the hold and next boxes all draw blocks, so let's give blocks a nicer look in one shared place. Add this at the end of `tetromino.gd`:

```gdscript title="tetromino.gd"
## Draw one block with a darker edge and a highlight. Shared by the board and
## the preview boxes.
static func draw_block(canvas: CanvasItem, rect: Rect2, color: Color) -> void:
	canvas.draw_rect(rect, color.darkened(0.45))
	canvas.draw_rect(rect.grow(-1), color)
	canvas.draw_rect(Rect2(rect.position + Vector2(1, 1), Vector2(rect.size.x - 2, 2)), color.lightened(0.4))
```

A **static** function belongs to the class rather than to a piece, so it's called as `Tetromino.draw_block(...)`. It draws on whichever `CanvasItem` you pass in: a dark border, the colour inside it, and a light 2 px strip along the top that reads as a bevel.

```quiz
question: A Z piece has position (4, 10). Which cells does `cells()` return?
options:
  - (4, 10), (5, 10), (5, 11), (6, 11)
  - (0, 0), (1, 0), (1, 1), (2, 1)
  - (4, 10), (5, 10), (3, 11), (4, 11)
answer: 0
explain: The Z's shape is (0, 0), (1, 0), (1, 1), (2, 1). Adding (4, 10) to each gives the first answer. The third answer is an S.
```

```quiz
question: Why does Tetromino extend RefCounted instead of Node?
options:
  - Nodes can't have an enum
  - A piece is plain data; it doesn't need the scene tree, and RefCounted frees itself when unused
  - RefCounted objects are drawn automatically
answer: 1
```
