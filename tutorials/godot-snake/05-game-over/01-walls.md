---
title: Walls
description: Checking the next cell before moving, and starting over with await.
estimatedMinutes: 15
---

## Inside or outside?

The board's cells go from (0, 0) to (35, 19). A cell is inside if both its x and y are in range. Godot's `Rect2i` (a rectangle with whole-number coordinates) can check that for us. Add this to `board.gd`, between `cell_center` and `free_cells`:

```gdscript title="board.gd" ins={6-9}
## The pixel position of a cell's centre, relative to the board.
static func cell_center(cell: Vector2i) -> Vector2:
	return cell_rect(cell).get_center()


static func is_inside(cell: Vector2i) -> bool:
	return Rect2i(Vector2i.ZERO, GRID_SIZE).has_point(cell)


## Every cell on the board that isn't in `taken`.
```

`Rect2i(Vector2i.ZERO, GRID_SIZE)` is a rectangle starting at (0, 0), 36 wide and 20 high. `has_point` includes the starting edge but not the far edge, so x = 0 is inside and x = 36 is outside. That's exactly the board.

## Look before you leap

This is why `next_head` and `move_to` are separate. The game asks where the head is about to go, and only moves if it's safe:

```gdscript title="game.gd" ins={3-5}
func _on_move_timer_timeout() -> void:
	var head := snake.next_head()
	if not Board.is_inside(head):
		_game_over()
		return
	var eating := head == food.cell
	snake.move_to(head, eating)
	if eating:
		_eat()
```

```gdscript title="game.gd" ins={4-10}
func _place_food() -> void:
	var cells := Board.free_cells(snake.body)
	food.place(cells.pick_random())


func _game_over() -> void:
	move_timer.stop()
	# For now, start again after a second. Chapter 7 adds a game over screen.
	await get_tree().create_timer(1.0).timeout
	get_tree().reload_current_scene()
```

- Checking first means the snake stops with its head still on the board, so the player sees exactly where they crashed.
- Stopping the timer ends the ticks. The snake freezes in place.
- `get_tree()` is the **SceneTree**, the object that runs the whole game. `create_timer(1.0)` makes a throwaway one-second timer.
- `await` pauses *this function* until the signal after it fires, here the timer's `timeout`. The rest of the game keeps running in the meantime. One second later, the function continues where it left off.
- `reload_current_scene()` throws the game scene away and loads it fresh: new snake, new food, score back to 0. No reset code needed.

Run the game and steer into a wall. The snake stops, and a second later a new game begins.

```quiz
question: Which of these cells are inside our 36 × 20 board? Select all that apply.
type: multiple
options:
  - (0, 0)
  - (35, 19)
  - (36, 5)
  - (5, -1)
answer: [0, 1]
explain: Columns go from 0 to 35 and rows from 0 to 19. (36, 5) is one column past the right edge, (5, -1) one row above the top.
```

```quiz
question: What does `await get_tree().create_timer(1.0).timeout` do?
options:
  - Freezes the whole game for one second
  - Pauses only the current function for one second, then continues it
  - Calls the next line every second
answer: 1
```
