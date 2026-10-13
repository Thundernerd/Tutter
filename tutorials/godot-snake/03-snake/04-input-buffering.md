---
title: Input buffering
description: A small queue of turns, so quick key presses are never lost.
estimatedMinutes: 20
---

## The problem

On the last page, the snake remembered only **one** turn between ticks. That's fine when you play slowly, but good players press keys quickly: ↑ then ← to make a tight U-turn. The second press was either ignored (it looked like a reversal) or replaced the first one. At high speed, that makes the snake feel unresponsive, and it's the number one way to get killed unfairly in a Snake game.

## The solution: a queue

Instead of one next direction, keep a short **queue** of turns. A queue works like a line at a shop: new turns join at the back, and every tick takes the turn at the front.

| Between ticks you press | Queue | Next tick moves | Tick after that |
| --- | --- | --- | --- |
| ↑ | [↑] | up | (straight on) |
| ↑ then ← | [↑, ←] | up | left |
| ↑ then ↑ | [↑] | up | |
| ↑ then ↓ | [↑] | up | |
| ↑, ←, ↓ | [↑, ←] | up | left |

The rules for accepting a new turn:

1. Compare it with the **last turn in the queue**, because that's the way the snake will be heading by the time this turn happens. If the queue is empty, compare with the current direction.
2. Ignore it if it's the same direction (no point queueing "keep going") or the exact reverse.
3. Ignore it if the queue already holds two turns. Without a limit, mashing keys would plan moves far into the future, which feels just as bad as losing them.

## The code

Replace `_next_direction` with an array, and rewrite `turn` and `next_head`:

```gdscript title="snake.gd" ins={1-2}
## How many turns can wait for the next moves.
const MAX_QUEUED_TURNS := 2
const DIRECTIONS := {
```

```gdscript title="snake.gd" ins={5,15,26,31-36,40,43-44} del={3-4,14,25,28-30,39,42}
## The direction of the last move.
var direction := Vector2i.RIGHT
## The direction of the next move, set by the steering keys.
var _next_direction := Vector2i.RIGHT
var _queued_turns: Array[Vector2i] = []


## Lay the snake out horizontally, head at `head`, facing right.
func reset(head: Vector2i, length: int) -> void:
	body.clear()
	for i in length:
		body.append(head - Vector2i(i, 0))
	direction = Vector2i.RIGHT
	_next_direction = direction
	_queued_turns.clear()
	queue_redraw()


func _unhandled_input(event: InputEvent) -> void:
	for action in DIRECTIONS:
		if event.is_action_pressed(action):
			turn(DIRECTIONS[action])


## Steer. Reversing into the neck is ignored.
## Queue a turn. Repeating the current direction or reversing into the neck is ignored.
func turn(new_direction: Vector2i) -> void:
	# Compare with the direction of the last *move*, not the last key press.
	if new_direction != -direction:
		_next_direction = new_direction
	# Compare with the last *queued* direction: that's where we'll be heading by then.
	var last: Vector2i = direction if _queued_turns.is_empty() else _queued_turns.back()
	if new_direction == last or new_direction == -last:
		return
	if _queued_turns.size() < MAX_QUEUED_TURNS:
		_queued_turns.append(new_direction)


## Apply the steering and return the cell the head moves into.
## Take the next queued turn (if any) and return the cell the head moves into.
func next_head() -> Vector2i:
	direction = _next_direction
	if not _queued_turns.is_empty():
		direction = _queued_turns.pop_front()
	return body[0] + direction
```

- `back()` reads the last element without removing it; `pop_front()` removes the first element and gives it to you. Together they make the array behave as a queue.
- `return` leaves the function immediately. Nothing after it runs.
- `or` is true if either side is true.
- Why `var last: Vector2i =` instead of `:=`? `back()` is declared to return a `Variant` ("any type"), even on a typed array, so Godot can't work out the variable's type from it. Writing the type explicitly fixes that.
- The direction only changes in `next_head`, once per tick. That's what keeps the reversal check honest.

Run the game and try the quick U-turn again: ↑← while moving right. The snake neatly turns up, then left. Try mashing all four keys: the snake does at most two of them, and never reverses.

:::note[Why two?]
One queued turn is what most players need; two cover quick U-turns. Try `MAX_QUEUED_TURNS := 3` or `1` and see how it feels. Little values like this are worth playtesting.
:::

```quiz
question: The snake moves right. Within one tick you press ↑, then ←, then ↓. What's in the queue?
options:
  - "[↑, ←, ↓]"
  - "[↑, ←]"
  - "[↑]"
  - "[↓]"
answer: 1
explain: ↑ is fine. ← is compared with ↑ (the last queued turn), so it's fine too. ↓ would be fine compared with ←, but the queue is already full with two turns.
```

```quiz
question: Why are new turns compared with the last *queued* turn, not with the current direction?
options:
  - Because that's the direction the snake will be moving in when the new turn happens
  - Because the current direction is always zero
  - It doesn't matter which one we compare with
answer: 0
explain: 'With [↑] queued while moving right, ← must be allowed: after moving up, going left is a normal turn. Compared with "right" it would look like a reversal.'
```
