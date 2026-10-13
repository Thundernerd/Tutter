---
title: Locking and lock delay
description: Copying a landed piece into the grid, a grace period before it locks, and topping out.
estimatedMinutes: 25
---

## Locking a piece into the grid

When a piece can't fall any further it **locks**: its four cells are written into the grid, it stops being "the falling piece", and the next one spawns. Add this to `board.gd`, after `fits()`:

```gdscript title="board.gd"
## Copy the piece's cells into the grid. Returns false if any cell
## stuck out above the top of the board, which ends the game.
func lock_piece(locked: Tetromino) -> bool:
	var inside := true
	for cell in locked.cells():
		if cell.y < 0:
			inside = false
		else:
			rows[cell.y][cell.x] = locked.type
	piece = null
	return inside
```

Each cell gets the piece's type, so it keeps its colour. Setting `piece = null` goes through the setter and redraws. Cells above the board can't be stored (there's no row for them), so we report them instead.

## Topping out

The game ends when the stack gets too high. There are two ways to notice that, and we check both:

| Name | When | Where we check |
| --- | --- | --- |
| Block out | A new piece doesn't fit where it spawns | `_spawn()` |
| Lock out | A piece locks with a cell above the top edge | `_lock_piece()`, using the value `lock_piece()` returns |

## Lock delay

The simplest rule would be "lock as soon as the piece can't fall". Try it in your head: the moment a piece touches down you'd lose all control, so sliding a piece under an overhang at the last moment would be impossible. Every modern game gives the player a grace period, the **lock delay**: once the piece is resting on something, it locks after half a second, unless it moves off the ledge first.

Moving or rotating a resting piece **restarts** the delay, so you can slide along the floor into position. To stop a player from spinning a piece forever, those restarts are limited to 15, and the counter only refills when the piece reaches a row lower than it has ever been. That's a simplified version of what's called the "move reset" rule.

Add a second `Timer` to `Game` named `LockTimer`, with **Wait Time** `0.5` and **One Shot** on, and connect its `timeout` signal to `Game` as well.

## The game script

Here's the whole script at the end of this chapter, with this page's changes highlighted:

```gdscript title="game.gd" ins={7-8,10,15-16,20,28-29,34-35,46-52,61,65-85,87-93,111-131}
extends Node2D

## Seconds per row. Chapter 6 turns this into a speed curve.
const FALL_INTERVAL := 1.0
## Seconds per row while soft drop is held.
const SOFT_DROP_INTERVAL := 0.05
## How often moving or rotating on the ground may restart the lock delay.
const MAX_LOCK_RESETS := 15

## The falling piece, or null between pieces and after game over.
var piece: Tetromino
var bag := PieceBag.new()

var _soft_dropping := false
var _lock_resets := 0
var _lowest_row := 0

@onready var board: Board = $Board
@onready var gravity_timer: Timer = $GravityTimer
@onready var lock_timer: Timer = $LockTimer


func _ready() -> void:
	_spawn(bag.next())


func _process(_delta: float) -> void:
	if piece == null:
		return
	_update_soft_drop()


func _unhandled_input(event: InputEvent) -> void:
	if piece == null:
		return
	# Temporary: allow_echo lets the keyboard's own key repeat move a held piece.
	if event.is_action_pressed(&"move_left", true):
		_try_move(Vector2i.LEFT)
	elif event.is_action_pressed(&"move_right", true):
		_try_move(Vector2i.RIGHT)


func _spawn(piece_type: int) -> void:
	piece = Tetromino.spawn(piece_type, Board.COLUMNS)
	board.piece = piece
	_lowest_row = piece.position.y
	_lock_resets = 0
	lock_timer.stop()
	if not board.fits(piece):
		_game_over() # Blocked right at the top: the stack is too high.
		return
	_update_lock_timer()
	_restart_gravity()


## Move the piece by `offset` if it fits there. Returns whether it moved.
func _try_move(offset: Vector2i) -> bool:
	var moved := piece.moved(offset)
	if not board.fits(moved):
		return false
	_set_piece(moved)
	return true


func _set_piece(new_piece: Tetromino) -> void:
	piece = new_piece
	board.piece = piece
	if piece.position.y > _lowest_row:
		# A new lowest point earns a fresh set of lock delay resets.
		_lowest_row = piece.position.y
		_lock_resets = 0
	_update_lock_timer()


## Start, restart or stop the lock delay depending on whether the piece is resting on something.
func _update_lock_timer() -> void:
	if board.fits(piece.moved(Vector2i.DOWN)):
		lock_timer.stop() # In the air: nothing to lock onto.
	elif lock_timer.is_stopped():
		lock_timer.start() # Just landed.
	elif _lock_resets < MAX_LOCK_RESETS:
		_lock_resets += 1
		lock_timer.start() # Moved while on the ground: start the countdown again.


func _on_gravity_timer_timeout() -> void:
	if piece:
		_try_move(Vector2i.DOWN)


func _on_lock_timer_timeout() -> void:
	if piece:
		_lock_piece()


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


func _lock_piece() -> void:
	lock_timer.stop()
	gravity_timer.stop()
	var locked := piece
	piece = null
	var inside := board.lock_piece(locked)
	if not inside:
		_game_over() # Locked partly above the board.
		return
	_spawn(bag.next())


func _game_over() -> void:
	piece = null
	gravity_timer.stop()
	lock_timer.stop()
	print("Game over")
	# Temporary: start a new game. Chapter 8 adds a real game over screen.
	get_tree().reload_current_scene.call_deferred()
```

Here's what each new piece does:

- **`_set_piece`** is now the only place that changes the falling piece after it spawns. Besides updating the board, it keeps track of the lowest row the piece has reached and then updates the lock delay. `_try_move` calls it instead of setting `piece` itself, and rotation will too.
- **`_update_lock_timer`** is the lock delay in four lines. If the piece could still move down, it's in the air: stop the timer. If it's resting and the timer isn't running, it just landed: start it. If it's resting and the timer *is* running, the player moved it on the ground: restart it, if there are resets left.
- **`_lock_piece`** stops both timers, writes the piece into the grid and spawns the next one. Setting `piece = null` first means no input or timer can touch the piece while it locks; that's what the `if piece == null` guards at the top of `_process`, `_unhandled_input` and the timer callbacks are for.
- **`_game_over`** is a placeholder: it prints a message and restarts the scene. `call_deferred` waits until the end of the frame, so we don't tear down the scene in the middle of the timer callback that's still running.

:::warning[Spawn checks come first]
In `_spawn`, we show the new piece on the board *before* checking whether it fits, so a blocked spawn is visible when the game ends. And we return right after `_game_over()`: starting the lock and gravity timers for a piece that can't exist would bring it back to life.
:::

Run the game. Pieces fall, lock, and stack up. Slide a piece along the floor and notice it doesn't lock while you keep moving it, at least for a while. Fill the well to the top and the game starts over.

```quiz
question: A piece rests on the floor with its lock timer running. The player moves it left, off the edge of a ledge, so it could fall again. What happens to the lock timer?
options:
  - It restarts at 0.5 seconds
  - It stops, because the piece is in the air again
  - It keeps running and locks the piece in mid-air
answer: 1
explain: '`_update_lock_timer` sees that `board.fits(piece.moved(Vector2i.DOWN))` is true, so it stops the timer. Gravity takes over until the piece lands again.'
```

```quiz
question: Which of these end the game? Select all that apply.
type: multiple
options:
  - A new piece overlaps the stack where it spawns
  - A piece locks with one of its cells above the top row
  - A piece locks in the top row, entirely inside the board
  - The player rotates a piece above the top edge
answer: [0, 1]
explain: Block out (spawn doesn't fit) and lock out (locked above the board). Locking in row 0 is fine, and pieces may move or rotate above the top while they're still falling.
```

```quiz
question: Why does `_lock_piece` set `piece = null` before writing it into the grid?
options:
  - So input and timer callbacks ignore the piece while it locks and the next one spawns
  - Because lock_piece() needs a null piece
  - To free the memory immediately
answer: 0
```
