---
title: Flood fill with recursion
description: The idea behind flood fill, a recursive version, and the call stack that limits it.
estimatedMinutes: 20
---

## The idea

A `0` means none of its eight neighbours is a mine. So all of them are safe to reveal, and the game can do it for you. If any of *those* is also a `0`, its neighbours are safe too, and so on. The region keeps growing until it's surrounded by numbers:

```text
before click          after clicking (0, 0)
■ ■ ■ ■               · · 1 ■
■ ■ ■ ■               · · 1 1
■ ■ ■ ■               · · · ·
```

`·` is a revealed `0`, `■` is still hidden. The single mine is the hidden cell top-right; everything else opened from one click. The rule in one sentence:

> Reveal the cell. If it's a `0`, do the same for each of its hidden neighbours.

## The recursive version

"Do the same for each neighbour" translates directly into a function that calls itself. This is **recursion**:

```gdscript
func _flood_recursive(pos: Vector2i) -> void:
	var cell := get_cell(pos)
	if not cell.can_reveal():
		return # Already revealed (or flagged): stop here.
	cell.state = CellState.REVEALED
	if cell.adjacent > 0:
		return # A number is the edge of the region.
	for next in neighbours(pos):
		_flood_recursive(next)
```

It's short and it reads like the rule. The first check matters: without it, cell A would recurse into its neighbour B, B straight back into A, A into B... forever.

So why not use it? To answer that, we need to look at how a function call actually works.

## The call stack

Every time a function is called, Godot pushes a **stack frame** onto the *call stack*: a little record holding the function's local variables and where to continue when it returns. The frame is popped when the function returns.

A recursive flood fill doesn't return until *all* of its neighbours' calls have returned, and they don't return until *their* neighbours have, and so on. The frames pile up:

```text
_flood_recursive(first cell)          ← waiting for its neighbours
  _flood_recursive(a neighbour)       ← waiting for its neighbours
    _flood_recursive(its neighbour)   ← waiting...
      _flood_recursive(...)
        ...                           ← one frame per step of the path so far
```

The depth of the pile is the length of the longest chain of calls. On an open board, recursion tends to snake through the region cell by cell, so the depth gets close to the **number of cells in the region**. We measured it on boards with a single mine in a corner:

| Board | Cells | Deepest stack |
| --- | --- | --- |
| 9×9 | 81 | 76 |
| 16×16 | 256 | 251 |
| 30×16 | 480 | 475 |
| 40×20 | 800 | 795 |

GDScript allows **1024** frames by default (**Project Settings → Debug → Settings → GDScript → Max Call Stack**). Past that, the script stops with:

```text
Stack overflow. Check for infinite recursion in your script.
```

The standard boards stay under the limit, but the largest custom board we'll allow already uses 795 of 1024, and one slightly larger custom size, or a future "huge board" option, would crash on a single unlucky click. Raising the limit only moves the problem, and each frame costs memory.

:::note[It's not about speed]
Both versions do the same amount of work: each cell is revealed once and looks at its neighbours once. The difference is *where the to-do list lives*. Recursion keeps it on the call stack, which is small and fixed. The next page keeps it in an ordinary array, which can grow as big as memory allows.
:::

Don't add `_flood_recursive` to the project. The next page writes the version we'll keep.

```quiz
question: What would happen if `_flood_recursive` didn't check `can_reveal()` first?
options:
  - It would reveal flagged cells
  - Two neighbouring zeros would call each other forever, until the stack overflows
  - Nothing; the check is only an optimisation
answer: 1
explain: Without the check, revealing doesn't stop the recursion. A calls B, B calls A, and the stack fills up. (It would also open flagged cells, but the infinite recursion comes first.)
```

```quiz
question: What limits how deep recursion can go in GDScript?
type: text
answer: ["max call stack", "the call stack", "call stack", "max_call_stack", "stack size", "the stack"]
hint: It's a project setting under Debug → Settings → GDScript.
explain: Each call adds a frame to the call stack, and GDScript allows 1024 frames by default (`Max Call Stack`).
```

```quiz
question: Roughly how deep can a recursive flood fill go on an empty region?
options:
  - "8, one level per neighbour"
  - About the width of the board
  - Close to the number of cells in the region
answer: 2
explain: Each call waits for all of its neighbours' calls, which tend to snake through the region one cell at a time. On a 40×20 board we measured a depth of 795.
```
