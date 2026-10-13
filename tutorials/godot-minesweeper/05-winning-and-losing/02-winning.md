---
title: Winning
description: What "cleared" really means, counted in one comparison.
estimatedMinutes: 10
---

## What counts as a win?

It's tempting to say "you win when every mine is flagged". But that rule has two problems: you could flag every cell and "win", and many good players never flag at all; they just reveal every safe cell.

The real rule is simpler: **you win when every safe cell is revealed.** Flags don't matter.

We've been counting revealed cells since the safe-first-click page, so the check is one comparison:

```text
safe cells = width × height − mine_count
won        = revealed_count == safe cells
```

| Board | Cells | Mines | Safe cells to reveal |
| --- | --- | --- | --- |
| Beginner 9×9 | 81 | 10 | 71 |
| Intermediate 16×16 | 256 | 40 | 216 |
| Expert 30×16 | 480 | 99 | 381 |

A wrong flag can never sneak through: a flagged safe cell isn't revealed, so the count can't reach the target until you remove the flag and reveal it.

## The code

Add `_check_win` at the end of `board_model.gd`:

```gdscript title="board_model.gd"
func _check_win() -> void:
	if state != GameState.PLAYING or revealed_count < width * height - mine_count:
		return
	state = GameState.WON
	# Flag the remaining mines, like the classic game does.
	for y in height:
		for x in width:
			var cell := get_cell(Vector2i(x, y))
			if cell.is_mine and cell.state != CellState.FLAGGED:
				cell.state = CellState.FLAGGED
				flags_placed += 1
```

The `state != GameState.PLAYING` check keeps a loss a loss. Flagging the remaining mines is a finishing touch from the original game: the board ends up showing exactly where every mine was, and the mine counter we add in the next chapter drops to zero.

Call it at the end of `reveal`:

```gdscript title="board_model.gd" ins={9}
func reveal(pos: Vector2i) -> Array[Vector2i]:
	var revealed: Array[Vector2i] = []
	if is_finished() or not get_cell(pos).can_reveal():
		return revealed
	if state == GameState.READY:
		place_mines(pos)
		state = GameState.PLAYING
	_open(pos, revealed)
	_check_win()
	return revealed
```

## Announce the win

In `board.gd`, add a second signal next to `game_lost`:

```gdscript title="board.gd" ins={1}
signal game_won
signal game_lost(cell: Vector2i)
```

and turn the `if` in `_reveal` into a `match` that handles both endings:

```gdscript title="board.gd" del={3-4} ins={5-9}
	if revealed.is_empty():
		return
	if model.state == BoardModel.GameState.LOST:
		game_lost.emit(model.exploded)
	match model.state:
		BoardModel.GameState.LOST:
			game_lost.emit(model.exploded)
		BoardModel.GameState.WON:
			game_won.emit()
	queue_redraw()
```

Connect `game_won` to `Game` in the Node dock, as you did for `game_lost`:

```gdscript title="game.gd"
func _on_board_game_won() -> void:
	print("Cleared!")
```

That's a complete game of Minesweeper. Play a few rounds of beginner; it should be winnable in a minute or two.

```quiz
question: An intermediate board (16×16, 40 mines) has 215 cells revealed. Has the player won?
options:
  - Yes
  - No, one more safe cell to go
  - It depends on the flags
answer: 1
explain: 256 − 40 = 216 safe cells. Flags never count towards a win.
```

```quiz
question: A player flags one safe cell by mistake and reveals everything else. What happens?
options:
  - They win, the flag is ignored
  - They can't win until they remove the flag and reveal that cell
  - They lose
answer: 1
explain: The flagged cell isn't revealed, so `revealed_count` stays one short of the target.
```

```quiz
question: Why does `_check_win` start by checking `state != GameState.PLAYING`?
options:
  - So a game that was just lost can't also be won
  - To make the function faster
  - Because flags can only be placed while playing
answer: 0
explain: Chording (next page) can hit a mine *and* reveal the last safe cells in the same move. A loss must stay a loss.
```
