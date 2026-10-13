---
title: Auto-repeat (DAS and ARR)
description: Our own timing for held left and right keys, instead of the operating system's.
estimatedMinutes: 20
---

## Why not key repeat?

Right now, holding <kbd>←</kbd> relies on the operating system's key repeat (the `allow_echo` flag). That has three problems: the timing depends on each player's OS settings, it's usually too slow for this kind of game, and you can't change it from the game. Every serious falling blocks game handles it itself, with two numbers:

| Name | Meaning | Our default |
| --- | --- | --- |
| **DAS** (delayed auto shift) | How long you hold a direction before the piece starts sliding | 170 ms |
| **ARR** (auto repeat rate) | Time between steps while sliding; 0 means "teleport to the wall" | 50 ms |

```text
key held:  |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■|
moves:     ↑                   ↑    ↑    ↑    ↑    ↑    ↑
           press               DAS  +ARR +ARR +ARR ...
```

The first step happens the moment you press, so a quick tap moves exactly one column. Holding waits out the DAS and then slides.

## The code

Replace the echo-based movement in `game.gd`. The two constants become settings in the options chapter, so players can tune them:

```gdscript title="game.gd" ins={3-6,12-15,20,24,36} del={19,30-35}
## How many upcoming pieces the HUD shows.
const NEXT_COUNT := 3
## Delayed auto shift: how long left or right must be held before the piece slides, in seconds.
const DAS := 0.17
## Auto repeat rate: the time between steps while sliding, in seconds. 0 slides instantly.
const ARR := 0.05

# ...

var _lock_resets := 0
var _lowest_row := 0
## -1 while left is held, 1 for right, 0 for neither.
var _shift_direction := 0
## Counts down to the next automatic sideways step.
var _shift_timer := 0.0

# ...

func _process(_delta: float) -> void:
func _process(delta: float) -> void:
	if piece == null:
		return
	_update_soft_drop()
	_auto_shift(delta)


func _unhandled_input(event: InputEvent) -> void:
	if piece == null:
		return
	# Temporary: allow_echo lets the keyboard's own key repeat move a held piece.
	if event.is_action_pressed(&"move_left", true):
		_try_move(Vector2i.LEFT)
	elif event.is_action_pressed(&"move_right", true):
		_try_move(Vector2i.RIGHT)
	elif event.is_action_pressed(&"rotate_cw"):
	if event.is_action_pressed(&"rotate_cw"):
		_rotate(1)
```

And add `_auto_shift()` after `_update_soft_drop()`:

```gdscript title="game.gd"
## Move sideways on the first frame a direction is held, then wait for the
## auto-repeat delay (DAS), then keep stepping at the auto-repeat rate (ARR).
func _auto_shift(delta: float) -> void:
	var direction := roundi(Input.get_axis(&"move_left", &"move_right"))
	if direction != _shift_direction:
		_shift_direction = direction
		_shift_timer = DAS
		if direction != 0:
			_try_move(Vector2i(direction, 0))
		return
	if direction == 0:
		return
	_shift_timer -= delta
	while _shift_timer <= 0.0:
		if not _try_move(Vector2i(direction, 0)):
			_shift_timer = 0.0 # Against a wall: stay charged, but don't build up moves.
			return
		if ARR <= 0:
			continue # An ARR of 0 slides all the way in a single frame.
		_shift_timer += ARR
```

Step by step:

1. **`Input.get_axis`** returns −1 while only left is held, 1 for only right, and 0 for neither or both. `roundi` makes it a whole number, since it's a float (an analog stick could give 0.5).
2. **A change of direction** (pressing, releasing, or switching sides) moves one step immediately and restarts the DAS countdown.
3. **While held**, the timer counts down by `delta`, the seconds since the last frame. Once it reaches zero, the `while` loop moves and adds `ARR` back. A `while` instead of an `if` matters when ARR is shorter than a frame: at 60 frames per second (about 16.7 ms each) and an ARR of 5 ms, the piece should move three or four columns per frame, not one.
4. **At a wall**, the move fails. We clamp the timer to zero so it doesn't keep going further negative while you hold against the wall; otherwise, the moment the path cleared, the piece would make up for every missed step at once.
5. **ARR 0** skips adding time, so the loop keeps moving until the wall stops it, all in one frame.

`_process` passes `delta` through, which is why its parameter lost the underscore. Because the shift state lives in the game rather than the piece, holding a direction while one piece locks keeps the DAS "charged" for the next piece: a new piece slides immediately. That's how modern games behave too, and it's what makes fast play possible.

:::tip[Feel it]
Try DAS 100 and ARR 0 for a while. It feels twitchy at first, then very fast. The options chapter turns these into settings, because everyone's preference is different.
:::

## The whole script

Here's the complete `game.gd` at the end of this chapter, for reference. If something misbehaves, compare yours with it:

```gdscript title="game.gd"
extends Node2D

## Points for clearing 0, 1, 2, 3 or 4 lines at once, before multiplying by the level.
const LINE_SCORES: Array[int] = [0, 100, 300, 500, 800]
const LINES_PER_LEVEL := 10
## Gravity stops speeding up after this level.
const MAX_SPEED_LEVEL := 15
## Seconds per row while soft drop is held.
const SOFT_DROP_INTERVAL := 0.05
## How often moving or rotating on the ground may restart the lock delay.
const MAX_LOCK_RESETS := 15
## How many upcoming pieces the HUD shows.
const NEXT_COUNT := 3
## Delayed auto shift: how long left or right must be held before the piece slides, in seconds.
const DAS := 0.17
## Auto repeat rate: the time between steps while sliding, in seconds. 0 slides instantly.
const ARR := 0.05

## The falling piece, or null between pieces and after game over.
var piece: Tetromino
var bag := PieceBag.new()
## The Tetromino.Type in the hold box, or -1 when it's empty.
var hold_type := -1
var can_hold := true
var score := 0
var lines := 0
var level := 1

var _soft_dropping := false
var _lock_resets := 0
var _lowest_row := 0
## -1 while left is held, 1 for right, 0 for neither.
var _shift_direction := 0
## Counts down to the next automatic sideways step.
var _shift_timer := 0.0

@onready var board: Board = $Board
@onready var hud: CanvasLayer = $HUD
@onready var gravity_timer: Timer = $GravityTimer
@onready var lock_timer: Timer = $LockTimer


func _ready() -> void:
	hud.update_stats(score, level, lines)
	hud.update_hold(hold_type, can_hold)
	_spawn(bag.next())


## Seconds per row at `for_level`. Level 1 is one row per second.
static func fall_interval(for_level: int) -> float:
	var steps := mini(for_level, MAX_SPEED_LEVEL) - 1
	return pow(0.8 - steps * 0.007, steps)


func _process(delta: float) -> void:
	if piece == null:
		return
	_update_soft_drop()
	_auto_shift(delta)


func _unhandled_input(event: InputEvent) -> void:
	if piece == null:
		return
	if event.is_action_pressed(&"rotate_cw"):
		_rotate(1)
	elif event.is_action_pressed(&"rotate_ccw"):
		_rotate(-1)
	elif event.is_action_pressed(&"hard_drop"):
		hard_drop()
	elif event.is_action_pressed(&"hold"):
		hold()


func _spawn(piece_type: int) -> void:
	piece = Tetromino.spawn(piece_type, Board.COLUMNS)
	board.piece = piece
	_lowest_row = piece.position.y
	_lock_resets = 0
	lock_timer.stop()
	hud.update_next(bag.peek(NEXT_COUNT))
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


## Turn the piece, trying each wall kick in turn until one fits.
func _rotate(direction: int) -> void:
	var turned := piece.rotated(direction)
	for kick in piece.kicks(direction):
		var kicked := turned.moved(kick)
		if board.fits(kicked):
			_set_piece(kicked)
			return


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
	if piece and _try_move(Vector2i.DOWN) and _soft_dropping:
		_add_score(1)


func _on_lock_timer_timeout() -> void:
	if piece:
		_lock_piece()


func _restart_gravity() -> void:
	var interval := fall_interval(level)
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


## Move sideways on the first frame a direction is held, then wait for the
## auto-repeat delay (DAS), then keep stepping at the auto-repeat rate (ARR).
func _auto_shift(delta: float) -> void:
	var direction := roundi(Input.get_axis(&"move_left", &"move_right"))
	if direction != _shift_direction:
		_shift_direction = direction
		_shift_timer = DAS
		if direction != 0:
			_try_move(Vector2i(direction, 0))
		return
	if direction == 0:
		return
	_shift_timer -= delta
	while _shift_timer <= 0.0:
		if not _try_move(Vector2i(direction, 0)):
			_shift_timer = 0.0 # Against a wall: stay charged, but don't build up moves.
			return
		if ARR <= 0:
			continue # An ARR of 0 slides all the way in a single frame.
		_shift_timer += ARR


func hard_drop() -> void:
	var distance := board.drop_distance(piece)
	piece = piece.moved(Vector2i(0, distance))
	_add_score(distance * 2)
	_lock_piece()


## Swap the falling piece with the hold box. Allowed once per piece.
func hold() -> void:
	if not can_hold:
		return
	can_hold = false
	var held := piece.type
	if hold_type == -1:
		_spawn(bag.next())
	else:
		_spawn(hold_type)
	hold_type = held
	hud.update_hold(hold_type, can_hold)


func _lock_piece() -> void:
	lock_timer.stop()
	gravity_timer.stop()
	var locked := piece
	piece = null
	var inside := board.lock_piece(locked)
	if not inside:
		_game_over() # Locked partly above the board.
		return
	can_hold = true
	hud.update_hold(hold_type, can_hold)
	var full := board.full_rows()
	if not full.is_empty():
		board.clear_rows(full)
		_score_lines(full.size())
	_spawn(bag.next())


func _score_lines(count: int) -> void:
	lines += count
	score += LINE_SCORES[count] * level
	@warning_ignore("integer_division")
	var new_level := lines / LINES_PER_LEVEL + 1
	if new_level > level:
		level = new_level
	hud.update_stats(score, level, lines)


func _add_score(points: int) -> void:
	score += points
	hud.update_stats(score, level, lines)


func _game_over() -> void:
	piece = null
	gravity_timer.stop()
	lock_timer.stop()
	print("Game over")
	# Temporary: start a new game. Chapter 8 adds a real game over screen.
	get_tree().reload_current_scene.call_deferred()
```

```quiz
question: DAS is 170 ms and ARR is 50 ms. You hold right for 300 ms on an empty board. How many columns does the piece move?
options:
  - "1"
  - "3"
  - "4"
  - "6"
answer: 2
hint: Count the first press, then the step at 170 ms, then one every 50 ms after that.
explain: One step on the press, one at 170 ms, then at 220 and 270 ms. The next would be at 320 ms. That's 4 columns.
```

```quiz
question: Why does `_auto_shift` reset `_shift_timer` to 0 when the piece hits a wall?
options:
  - To stop the piece from making up several missed steps at once when the path clears
  - Because negative timers crash Godot
  - To reset DAS so the piece has to wait again
answer: 0
```
