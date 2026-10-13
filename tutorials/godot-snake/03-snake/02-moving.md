---
title: Moving
description: Add a head, drop the tail.
estimatedMinutes: 15
---

## The trick

How do you move a snake of 50 segments one step? You might think every segment has to move into the spot of the one in front of it. But look at what actually changes:

| | body |
| --- | --- |
| Before | (8, 10) (7, 10) (6, 10) |
| After one move right | **(9, 10)** (8, 10) (7, 10) |

The middle didn't change at all! Moving is just two steps, whatever the length:

1. Add a new head in front, one cell in the direction of travel.
2. Remove the last cell, the tail.

Arrays have exactly the right functions: `push_front` adds to the start of the array, `pop_back` removes from the end.

## Directions

A direction is a `Vector2i` too: the step from one cell to the next. Godot has names for the four we need:

| Constant | Value | Because |
| --- | --- | --- |
| `Vector2i.RIGHT` | (1, 0) | x grows to the right |
| `Vector2i.LEFT` | (-1, 0) | |
| `Vector2i.DOWN` | (0, 1) | y grows **downwards** in 2D Godot |
| `Vector2i.UP` | (0, -1) | |

The next head is simply the current head plus the direction: (8, 10) + (1, 0) = (9, 10).

## The code

Add a direction and two functions to `snake.gd`:

```gdscript title="snake.gd" ins={3-4,12,16-26}
## Grid cells from the head (index 0) to the tail.
var body: Array[Vector2i] = []
## The direction of the last move.
var direction := Vector2i.RIGHT


## Lay the snake out horizontally, head at `head`, facing right.
func reset(head: Vector2i, length: int) -> void:
	body.clear()
	for i in length:
		body.append(head - Vector2i(i, 0))
	direction = Vector2i.RIGHT
	queue_redraw()


## Return the cell the head moves into.
func next_head() -> Vector2i:
	return body[0] + direction


## Move the head into `cell`. The tail follows, unless the snake is growing.
func move_to(cell: Vector2i, grow: bool) -> void:
	body.push_front(cell)
	if not grow:
		body.pop_back()
	queue_redraw()
```

Why two functions instead of one `move()`? Because the game needs to look before it leaps. In chapter 5, the game will check whether the next cell is a wall, *before* moving into it. And `grow` is for chapter 4: when the snake eats, it keeps its tail for one move and gets one cell longer. A `bool` is a value that's either `true` or `false`; `not grow` flips it.

Now let the game move the snake on every tick:

```gdscript title="game.gd" ins={3-4} del={2}
func _on_move_timer_timeout() -> void:
	pass # Moving comes next.
	var head := snake.next_head()
	snake.move_to(head, false)
```

Run it. The snake slides to the right, one cell per tick... and right off the board, never to be seen again. Walls arrive in chapter 5; first we'll learn to steer.

```quiz
question: "The body is [(4, 4), (3, 4), (2, 4)] and the direction is `Vector2i.UP`. What is the body after one move?"
options:
  - "[(4, 3), (4, 4), (3, 4)]"
  - "[(4, 5), (4, 4), (3, 4)]"
  - "[(4, 3), (3, 3), (2, 3)]"
answer: 0
explain: 'The new head is (4, 4) + (0, -1) = (4, 3), pushed to the front. The tail (2, 4) is popped off the back. Remember: up is negative y.'
```

```quiz
type: text
question: Which array function removes the last element?
answer: [pop_back, pop_back()]
```
