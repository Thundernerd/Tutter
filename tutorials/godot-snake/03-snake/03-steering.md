---
title: Steering
description: Turning with the input actions, and the one turn that's never allowed.
estimatedMinutes: 20
---

## From actions to directions

A **dictionary** maps keys to values, like a phone book maps names to numbers. We'll map each input action to the direction it stands for. Add it at the top of `snake.gd`, with a colour for the eyes we'll draw in a moment:

```gdscript title="snake.gd" ins={5-10,14}
class_name Snake
extends Node2D
## The snake: a list of grid cells, head first.

const DIRECTIONS := {
	&"move_up": Vector2i.UP,
	&"move_down": Vector2i.DOWN,
	&"move_left": Vector2i.LEFT,
	&"move_right": Vector2i.RIGHT,
}
const HEAD_COLOR := Color("b4f07a")
const BODY_COLOR := Color("5fcf6a")
const TAIL_COLOR := Color("2f7d5b")
const EYE_COLOR := Color("10121a")
```

`DIRECTIONS[&"move_up"]` is now `Vector2i.UP`. The `&` in `&"move_up"` makes a **StringName**, a kind of text Godot can compare very quickly; input action names are StringNames internally.

## The forbidden turn

The snake can turn left or right, but never straight back: moving right and pressing left would steer the head into its own neck. Real Snake games simply ignore that key press.

There's a subtle trap here. The key press and the move don't happen at the same moment: the player presses a key *between* two ticks, and the turn only happens at the next tick. So we keep two directions:

- `direction`: the direction of the **last move**. Only the tick changes it.
- `_next_direction`: where the **next move** will go. Key presses change it.

A turn is forbidden if it's the reverse of `direction`, the move the snake actually made. Checking against the last *key press* instead would let this happen, all within one tick:

```text
moving right → press ↑ (fine) → press ← (fine: not the reverse of ↑)
next tick: the snake moves left, straight into its neck
```

The leading underscore in `_next_direction` is a naming convention for "private": only the snake's own code should touch it.

## The code

```gdscript title="snake.gd" ins={5-6,15,19-31,33,35} del={32}
## Grid cells from the head (index 0) to the tail.
var body: Array[Vector2i] = []
## The direction of the last move.
var direction := Vector2i.RIGHT
## The direction of the next move, set by the steering keys.
var _next_direction := Vector2i.RIGHT


## Lay the snake out horizontally, head at `head`, facing right.
func reset(head: Vector2i, length: int) -> void:
	body.clear()
	for i in length:
		body.append(head - Vector2i(i, 0))
	direction = Vector2i.RIGHT
	_next_direction = direction
	queue_redraw()


func _unhandled_input(event: InputEvent) -> void:
	for action in DIRECTIONS:
		if event.is_action_pressed(action):
			turn(DIRECTIONS[action])


## Steer. Reversing into the neck is ignored.
func turn(new_direction: Vector2i) -> void:
	# Compare with the direction of the last *move*, not the last key press.
	if new_direction != -direction:
		_next_direction = new_direction


## Return the cell the head moves into.
## Apply the steering and return the cell the head moves into.
func next_head() -> Vector2i:
	direction = _next_direction
	return body[0] + direction
```

- `for action in DIRECTIONS:` loops over the dictionary's keys, the four action names. Whichever one the event matches, we turn that way.
- `-direction` flips both x and y: the reverse of (1, 0) is (-1, 0). `!=` means "is not equal to".
- Turning lives in its own function, `turn`, so `_unhandled_input` stays short. The next page improves `turn` without touching the input code.

## Eyes

With steering, it helps to see which way the head faces. Draw two eyes on it:

```gdscript title="snake.gd" ins={7-15}
func _draw() -> void:
	for i in body.size():
		var color := HEAD_COLOR
		if i > 0:
			color = BODY_COLOR.lerp(TAIL_COLOR, float(i) / body.size())
		draw_rect(Board.cell_rect(body[i]).grow(-1), color)
	_draw_eyes()


func _draw_eyes() -> void:
	var center := Board.cell_center(body[0])
	var forward := Vector2(direction) * 3
	var side := Vector2(-direction.y, direction.x) * 3.5
	for eye in [center + forward + side, center + forward - side]:
		draw_rect(Rect2(eye - Vector2(1.5, 1.5), Vector2(3, 3)), EYE_COLOR)
```

The eyes sit 3 pixels forward from the centre of the head, and 3.5 pixels to each side. Swapping x and y and negating one of them, `(-y, x)`, turns a direction a quarter turn: the side direction. Facing right (1, 0), "side" is (0, 1): the eyes sit above and below the centre. Facing up (0, -1), "side" is (1, 0): left and right.

Run the game and steer with the arrow keys. Try to reverse: nothing happens. Now try a quick U-turn: ↑ and ← right after each other while moving right. The snake only goes up; the ← got rejected. The next page fixes that.

```quiz
question: The snake is moving right. Within one tick you press ↓ and then ←. With this page's code, what is the next move?
options:
  - Down
  - Left, into the neck
  - Right; both presses are ignored
answer: 0
explain: '↓ is allowed and sets `_next_direction`. ← is the reverse of `direction` (still right, the last *move*), so it is ignored. The snake moves down.'
```
