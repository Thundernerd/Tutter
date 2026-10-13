---
title: Gravity and soft drop
description: A Timer node pulls the piece down, and soft drop shortens its interval.
estimatedMinutes: 15
---

## Falling on a timer

Gravity in this genre isn't acceleration: the piece drops **one row** every so often. At the first level that's once per second, and later levels shorten the interval. A `Timer` node is exactly that: it counts down and emits `timeout`, over and over.

Add a `Timer` child to `Game`, name it `GravityTimer`, and leave its settings at their defaults; the code sets the interval. Connect its `timeout` signal to `Game` (select it, open the **Node** dock → **Signals**, double-click `timeout`, pick `Game`). Godot adds an empty `_on_gravity_timer_timeout` to `game.gd`.

:::tip[Why a Timer node?]
A Timer that's part of the game scene pauses with the game and disappears with it when you quit to the menu. A loose `await get_tree().create_timer(1.0).timeout` would do neither, unless you're careful.
:::

## Soft drop

While soft drop is held, the piece falls at 20 rows per second instead. Rather than writing a second falling mechanism, soft drop just **shortens the gravity interval**. When the key goes down or up, we restart the timer with the right interval:

```gdscript title="game.gd" ins={2-6,12-13,15,20-23,37,48-68}
extends Node2D

## Seconds per row. Chapter 6 turns this into a speed curve.
const FALL_INTERVAL := 1.0
## Seconds per row while soft drop is held.
const SOFT_DROP_INTERVAL := 0.05

## The falling piece.
var piece: Tetromino
var bag := PieceBag.new()

var _soft_dropping := false

@onready var board: Board = $Board
@onready var gravity_timer: Timer = $GravityTimer


func _ready() -> void:
	_spawn(bag.next())


func _process(_delta: float) -> void:
	_update_soft_drop()


func _unhandled_input(event: InputEvent) -> void:
	# Temporary: allow_echo lets the keyboard's own key repeat move a held piece.
	if event.is_action_pressed(&"move_left", true):
		_try_move(Vector2i.LEFT)
	elif event.is_action_pressed(&"move_right", true):
		_try_move(Vector2i.RIGHT)


func _spawn(piece_type: int) -> void:
	piece = Tetromino.spawn(piece_type, Board.COLUMNS)
	board.piece = piece
	_restart_gravity()


## Move the piece by `offset` if it fits there. Returns whether it moved.
func _try_move(offset: Vector2i) -> bool:
	var moved := piece.moved(offset)
	if not board.fits(moved):
		return false
	piece = moved
	board.piece = piece
	return true


func _on_gravity_timer_timeout() -> void:
	_try_move(Vector2i.DOWN)


func _restart_gravity() -> void:
	var interval := FALL_INTERVAL
	if _soft_dropping:
		interval = minf(interval, SOFT_DROP_INTERVAL)
	gravity_timer.start(interval)


func _update_soft_drop() -> void:
	var pressed := Input.is_action_pressed(&"soft_drop")
	if pressed == _soft_dropping:
		return
	_soft_dropping = pressed
	_restart_gravity()
	if pressed:
		_on_gravity_timer_timeout() # React on the first frame, not one interval later.
```

- **`_process(delta)`** runs every frame. We don't need `delta` yet, hence the leading underscore, which tells Godot the unused parameter is intentional.
- **`_update_soft_drop`** polls the key every frame but only acts when its state *changes*: `_soft_dropping` remembers what it was last frame.
- **`gravity_timer.start(interval)`** sets the timer's wait time and restarts the countdown in one call.
- **`minf`** keeps the faster of the two speeds. Right now soft drop is always faster, but at high levels normal gravity will beat 0.05 seconds, and soft drop must never *slow* a piece down.
- Moving down on the first frame of a soft drop makes the key feel instant instead of waiting up to 0.05 seconds.

Run it. Pieces now fall, and <kbd>↓</kbd> speeds them up. But once a piece reaches the floor it just sits there, and the timer keeps trying to move it down forever. Time to lock it.

```quiz
question: At a level where normal gravity is 0.02 seconds per row, what interval does soft drop use?
options:
  - "0.05"
  - "0.02"
  - "0.07"
answer: 1
explain: '`minf(0.02, 0.05)` is 0.02. Soft drop never makes a piece fall slower than normal gravity.'
```

```quiz
question: "Why does `_update_soft_drop` compare `pressed` with `_soft_dropping` before doing anything?"
options:
  - To restart the gravity timer only when the key is pressed or released, not on every frame it's held
  - Because Input.is_action_pressed is slow
  - To stop the piece at the floor
answer: 0
explain: Restarting the timer every frame would reset its countdown every frame, so it would never reach zero.
```
