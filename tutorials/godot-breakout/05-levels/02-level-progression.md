---
title: Clearing a level
description: Counting bricks, bound signal arguments, and moving on to the next level.
estimatedMinutes: 15
---

A level is cleared when every *breakable* brick is gone. Steel doesn't count, otherwise *Checkers* and *Fortress* could never be finished.

## Counting bricks

The brick grid already knows every brick it creates, so it's the natural place to count them. It also becomes the one place the rest of the game listens to for brick events:

```gdscript title="brick_grid.gd" ins={2-6,15-17,22,40-41,43-51}
extends Node2D
## Builds a level's bricks from its text layout and reports when they're all gone.

signal brick_damaged(brick: Node2D)
signal brick_destroyed(brick: Node2D)
signal cleared

const BRICK_SCENE := preload("res://brick.tscn")
## Room for each brick: 46×14 plus a 2px gap.
const CELL_SIZE := Vector2(48, 16)

## Which brick type each layout character stands for.
@export var brick_types: Dictionary[String, BrickType] = {}

## Breakable bricks left. The level is cleared when this reaches 0.
var remaining := 0


func build(level: Level) -> void:
	for child in get_children():
		child.queue_free()
	remaining = 0
	var rows := level.layout.strip_edges().split("\n")
	for row in rows.size():
		var line := rows[row].strip_edges()
		for column in line.length():
			var symbol := line[column]
			if symbol == ".":
				continue
			if not brick_types.has(symbol):
				push_warning("Level '%s' uses unknown brick '%s'" % [level.title, symbol])
				continue
			_add_brick(brick_types[symbol], Vector2(column, row) * CELL_SIZE + CELL_SIZE / 2)


func _add_brick(type: BrickType, at: Vector2) -> void:
	var brick := BRICK_SCENE.instantiate()
	brick.type = type
	brick.position = at
	brick.damaged.connect(brick_damaged.emit.bind(brick))
	brick.destroyed.connect(_on_brick_destroyed.bind(brick))
	add_child(brick)
	if not type.unbreakable:
		remaining += 1


func _on_brick_destroyed(brick: Node2D) -> void:
	remaining -= 1
	brick_destroyed.emit(brick)
	if remaining == 0:
		cleared.emit()
```

### `bind`

A brick's `destroyed` signal has no arguments: the brick doesn't say *which* brick it is. But the grid connects one handler to dozens of bricks and needs to know. `bind(brick)` creates a new **Callable** with `brick` stored inside it, so when brick #17 emits `destroyed`, `_on_brick_destroyed` is called with brick #17 as its argument.

`brick_damaged.emit.bind(brick)` takes it one step further: `brick_damaged.emit` is itself a callable (the signal's `emit` method), so a damaged brick makes the grid re-emit `brick_damaged(brick)` directly, without a handler function in between.

:::note[Why go through the grid?]
Bricks come and go with every level, so connecting the game to each one would mean reconnecting every time. The `Bricks` node stays put. The game connects to *it* once, in the editor, and never thinks about individual bricks.
:::

## Next level

Select `Bricks` in `game.tscn`, open the **Node** dock → **Signals**, and connect `cleared` to `Game`. Godot adds `_on_bricks_cleared` to `game.gd`. Fill it in, and move the ball reset into its own function, because every new level (and soon, every lost life) needs one:

```gdscript title="game.gd" ins={4-10,13-19}
func _start_level(index: int) -> void:
	level_index = index
	bricks.build(levels[index])
	_reset_round()


## Clear balls, pickups and power-ups, and put a fresh ball on the paddle.
func _reset_round() -> void:
	for ball in balls.get_children():
		ball.queue_free()
	var ball := _spawn_ball()
	ball.held_by = paddle


func _on_bricks_cleared() -> void:
	if level_index + 1 < levels.size():
		_start_level(level_index + 1)
	else:
		_start_level(0) # A proper "you win" screen comes in the menus chapter.
```

(Pickups and power-ups don't exist yet, but the comment is already true for the balls, and it will be soon for the rest.)

To test without breaking 48 bricks, give `level_01.tres` a layout of just one brick, like `r`, for a moment. Break it, and level 2 appears with a fresh ball on the paddle.

```quiz
question: Level 3 has 6 steel bricks and 30 others. What is `remaining` right after `build()`?
type: text
answer: ["30"]
explain: Only breakable bricks are counted, so the steel ones can't block the level from being cleared.
```

```quiz
question: What does `_on_brick_destroyed.bind(brick)` produce?
options:
  - The return value of `_on_brick_destroyed(brick)`
  - A Callable that will call `_on_brick_destroyed` with `brick` as an extra argument
  - A new signal
answer: 1
explain: Nothing is called yet. `bind` returns a callable with the argument baked in; `connect` stores it until the signal fires.
```
