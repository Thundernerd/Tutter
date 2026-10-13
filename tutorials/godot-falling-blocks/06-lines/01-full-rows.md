---
title: Full rows
description: Detecting completed rows and letting the stack above fall down.
estimatedMinutes: 15
---

## Finding full rows

A row is full when it doesn't contain a single empty cell. Arrays have a `has()` method, so the check is one line. Add both functions to `board.gd`, after `lock_piece()`:

```gdscript title="board.gd"
## The indices of all completely filled rows, top to bottom.
func full_rows() -> Array[int]:
	var result: Array[int] = []
	for y in ROWS:
		if not rows[y].has(EMPTY):
			result.append(y)
	return result


## Remove the rows and let everything above fall down.
func clear_rows(full: Array[int]) -> void:
	# Going top to bottom keeps the remaining indices valid: removing a row
	# and adding an empty one at the top leaves every row below in place.
	for y in full:
		rows.remove_at(y)
		rows.push_front(_empty_row())
	queue_redraw()
```

## Collapsing the stack

This is where storing the board as a list of rows pays off. To clear row `y`, we **remove** it from the list, which moves every row above it down by one index, and **add** a fresh empty row at the top so there are 20 rows again. No cell is copied by hand.

There's one subtlety when several rows clear at once. Say rows 17 and 19 are full:

```text
before            remove 17, add on top     remove 19, add on top
 0  ...            0  (new, empty)           0  (new, empty)
 ...               1  ...                    1  (new, empty)
16  A             17  A    ← moved down      2  ...
17  FULL          18  B    ← index 18 again 18  A
18  B             19  FULL                  19  B
19  FULL
```

Removing row 17 and pushing a row on top leaves everything *below* row 17 at the same index, so row 19 is still at 19 for the second step. That's why `full_rows()` returns indices top to bottom, and why `clear_rows()` processes them in that order. Going bottom-up would work too with a different trick, but top-down needs no index bookkeeping at all.

## Clear after locking

Lines can only become full when a piece locks, so that's where we check, before spawning the next piece. In `game.gd`:

```gdscript title="game.gd" ins={10-12}
func _lock_piece() -> void:
	lock_timer.stop()
	gravity_timer.stop()
	var locked := piece
	piece = null
	var inside := board.lock_piece(locked)
	if not inside:
		_game_over() # Locked partly above the board.
		return
	var full := board.full_rows()
	if not full.is_empty():
		board.clear_rows(full)
	_spawn(bag.next())
```

Run the game and complete a row. It vanishes and everything above drops down. Rows that aren't directly touching still clear together: if a vertical `I` completes rows 16 and 18 but not 17, both clear, and what's left of row 17 drops one row to fill the gap below it.

```quiz
question: Which single line in `full_rows()` decides whether row `y` is full?
options:
  - "if not rows[y].has(EMPTY):"
  - "if rows[y].size() == COLUMNS:"
  - "if rows[y][0] != EMPTY:"
answer: 0
explain: Every row always has 10 entries, so its size says nothing. A row is full when none of its entries is `EMPTY`.
```

```quiz
question: Rows 10 and 15 are full. After `clear_rows([10, 15])`, how many rows does `rows` contain?
type: text
answer: ["20", "twenty"]
explain: Each removed row is replaced by a new empty row at the top, so the board always keeps exactly 20 rows.
```
