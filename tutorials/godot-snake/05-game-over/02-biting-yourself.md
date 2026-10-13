---
title: Biting yourself
description: Self-collision, and why chasing your own tail is allowed.
estimatedMinutes: 15
---

## Is the next cell part of the body?

The snake dies when its head moves into its own body. That sounds like one line, `body.has(head)`, but there's a catch: the **tail**.

On a normal move, the tail leaves its cell in the same tick the head arrives. So moving into the cell the tail is in *right now* is perfectly safe, it'll be gone. Take a snake of four curled up in a little square:

```text
 tick 0           tick 1           tick 2
┌───┬───┐        ┌───┬───┐        ┌───┬───┐
│ 3 │ H │  ←     │ H │ 1 │        │ 1 │ 2 │
├───┼───┤        ├───┼───┤        ├───┼───┤
│ 2 │ 1 │        │ 3 │ 2 │        │ H │ 3 │
└───┴───┘        └───┴───┘        └───┴───┘
H = head, 3 = tail. The head always moves into the tail's old cell.
```

It can go round and round forever. Classic Snake allows this, and players expect it.

When the snake is **growing**, though, the tail stays where it is, so moving into it is a crash.

## The code

Add this to `snake.gd`, after `move_to`:

```gdscript title="snake.gd"
## Would moving the head into `cell` bite the body?
func hits_itself(cell: Vector2i, growing: bool) -> bool:
	var index := body.find(cell)
	if index == -1:
		return false
	# The tail moves out of the way this tick, unless the snake is growing.
	return growing or index != body.size() - 1
```

`find` returns the position of a value in the array, or `-1` if it's not there. The last index of an array is `size() - 1`, so `index != body.size() - 1` means "it's not the tail".

Then check it in the game, right after working out whether the snake is eating:

```gdscript title="game.gd" ins={7-9}
func _on_move_timer_timeout() -> void:
	var head := snake.next_head()
	if not Board.is_inside(head):
		_game_over()
		return
	var eating := head == food.cell
	if snake.hits_itself(head, eating):
		_game_over()
		return
	snake.move_to(head, eating)
	if eating:
		_eat()
```

## A full board

One more way for the game to end: a snake so long it fills the entire board. Then `free_cells` returns an empty list, and `pick_random()` on an empty array has nothing to give. That's a (very rare) win, so let's end the game properly:

```gdscript title="game.gd" ins={3-5}
func _place_food() -> void:
	var cells := Board.free_cells(snake.body)
	if cells.is_empty():
		_game_over() # The snake fills the whole board. Nothing left to eat!
		return
	food.place(cells.pick_random())
```

Run the game and steer into your own body: game over. With a short snake that takes some work. Eat a few pieces first, then try a tight U-turn the wrong way.

```quiz
question: "The snake is [(5, 5), (5, 6), (4, 6), (4, 5)] (head first) and moves left, into (4, 5). It's not eating. What happens?"
options:
  - It crashes into its body
  - Nothing special; (4, 5) is the tail, which moves away this tick
  - It grows
answer: 1
explain: (4, 5) is the last cell, the tail. `find` returns 3, which equals `size() - 1`, so it's not a hit.
```

```quiz
type: text
question: What does `[10, 20, 30].find(40)` return?
answer: ["-1"]
explain: '`find` returns -1 when the value is not in the array.'
```
