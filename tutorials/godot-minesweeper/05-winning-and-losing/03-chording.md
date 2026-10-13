---
title: Chording
description: Click a satisfied number to reveal all of its other neighbours at once.
estimatedMinutes: 15
---

Experienced players spend most of a game doing the same thing: they find a number whose mines are all flagged, then click every *other* neighbour one by one, because those must be safe. **Chording** does that in one click.

## The rule

Clicking a revealed number **chords** when the number of flags around it equals the number itself. Then every other covered neighbour is revealed.

```text
 before          after clicking the 2
 ■ ⚑ ■            1 ⚑ 1
 ■ 2 ■     →      2 2 2
 ■ ⚑ ■            1 ⚑ 1
```

The `2` has two flags next to it, so the other six neighbours must be safe, and they're all revealed in one go. (Any zeros among them would flood-fill as usual.)

If the flags *aren't* right, chording reveals a mine and you lose. That's fair: you told the game where the mines were, and it believed you. When the flag count doesn't match the number, chording does nothing at all.

## The model

Add `chord` to `board_model.gd`, right after `reveal`:

```gdscript title="board_model.gd"
## Clicking a number whose mines are all flagged reveals its other neighbours.
func chord(pos: Vector2i) -> Array[Vector2i]:
	var revealed: Array[Vector2i] = []
	var cell := get_cell(pos)
	if state != GameState.PLAYING or cell.state != CellState.REVEALED or cell.adjacent == 0:
		return revealed
	var flags := 0
	for next in neighbours(pos):
		if get_cell(next).state == CellState.FLAGGED:
			flags += 1
	if flags != cell.adjacent:
		return revealed
	for next in neighbours(pos):
		# Check again inside the loop: an earlier flood fill may have revealed it.
		if get_cell(next).can_reveal():
			_open(next, revealed)
	_check_win()
	return revealed
```

This is why we split `_open` out earlier: each neighbour is treated exactly as if the player had clicked it. A mine ends the game; a `0` floods. And because one neighbour's flood fill can reveal *another* neighbour before the loop gets to it, the `can_reveal()` check sits inside the loop, right before each `_open`.

Like `reveal`, `chord` returns every cell it revealed, and calls `_check_win()`: chording is often the move that clears the board.

## The board

A left click on a revealed cell now means "chord" instead of "reveal". Update `_reveal` in `board.gd`:

```gdscript title="board.gd" del={1,6} ins={2,7-11}
## Reveal a covered cell.
## Reveal a covered cell, or chord a revealed number.
func _reveal(pos: Vector2i) -> void:
	if pos == NO_CELL:
		return
	var revealed := model.reveal(pos)
	var revealed: Array[Vector2i]
	if model.get_cell(pos).state == BoardModel.CellState.REVEALED:
		revealed = model.chord(pos)
	else:
		revealed = model.reveal(pos)
	if revealed.is_empty():
		return
```

Many Minesweeper versions also chord with the middle mouse button, so add that to `_gui_input`. It calls the same function:

```gdscript title="board.gd" ins={8-9}
func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		var pos := _cell_at(event.position)
		if event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
			_reveal(pos)
		elif event.button_index == MOUSE_BUTTON_RIGHT and event.pressed:
			_toggle_flag(pos)
		elif event.button_index == MOUSE_BUTTON_MIDDLE and event.pressed:
			_reveal(pos)
		accept_event()
```

Run it and try it: flag the mines around a number, then click the number. Then flag a *wrong* cell next to a `1` and chord it, to see the losing board from the first page of this chapter.

```quiz
question: A revealed `3` has two flags and four hidden cells around it. What does clicking it do?
options:
  - Reveals the four hidden cells
  - Nothing, because the flags don't add up to 3
  - Places the third flag
answer: 1
explain: Chording only happens when the flag count equals the number exactly.
```

```quiz
question: Why is the `can_reveal()` check inside the loop over neighbours?
options:
  - To skip flagged neighbours, and neighbours an earlier flood fill already revealed
  - Because `_open` crashes on revealed cells
  - It isn't needed; it's just defensive
answer: 0
explain: Flags are skipped, and opening one neighbour can flood into another before the loop reaches it. Checking right before each `_open` handles both.
```

```quiz
question: A `1` has one flag next to it, but the flag is on a safe cell. What happens when you chord it?
options:
  - Nothing
  - The real mine is among the revealed neighbours, so you lose
  - The flag moves to the mine
answer: 1
explain: The flag count matches, so every other neighbour is opened, including the actual mine.
```
