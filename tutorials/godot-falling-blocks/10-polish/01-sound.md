---
title: Sound effects
description: Signals announce what happened; AudioStreamPlayers on the SFX bus listen.
estimatedMinutes: 20
---

## Get some sounds

Download the seven blips used in this tutorial: [blockfall-sounds.zip](./files/blockfall-sounds.zip). Unzip it into a `sounds/` folder in your project; Godot imports `.wav` files automatically.

| File | Plays when |
| --- | --- |
| `move.wav` | a piece moves sideways |
| `rotate.wav` | a piece rotates |
| `hold.wav` | you use hold |
| `lock.wav` | a piece locks |
| `clear.wav` | lines clear (higher pitch for more lines) |
| `level_up.wav` | the level goes up |
| `game_over.wav` | the stack tops out |

Want your own? [jsfxr](https://sfxr.me) generates retro sound effects in the browser: try the *Blip/Select* and *Hit/Hurt* presets.

## Players

Add a plain `Node` named `Sounds` to `game.tscn` (just a folder for tidiness) with seven `AudioStreamPlayer` children: `Move`, `Rotate`, `Hold`, `Lock`, `Clear`, `LevelUp` and `TopOut`. Give each its stream and set **Bus** to `SFX` on all of them; that's what makes the effects volume slider work. Also give the options screen's `TestSound` the `rotate.wav` stream, so the slider finally makes a sound.

:::note
`AudioStreamPlayer` plays at the same volume everywhere. `AudioStreamPlayer2D` gets quieter and pans with distance from the camera, which is great for big levels but pointless on a single screen.
:::

## Signals

We could call `$Sounds/Move.play()` right inside `_try_move`, but then the gameplay code would be tangled up with sound, and later with effects, statistics or achievements. Instead, the game **announces** what happened with signals, and anything interested can listen. Declare them at the top of `game.gd`, and connect the sounds in `_ready()`:

```gdscript title="game.gd" ins={2-10,17-24}
extends Node2D

signal piece_moved
signal piece_rotated
signal piece_held
signal piece_locked
signal hard_dropped(distance: int)
signal lines_cleared(count: int)
signal leveled_up(level: int)
signal topped_out

## Points for clearing 0, 1, 2, 3 or 4 lines at once, before multiplying by the level.

# ...

func _ready() -> void:
	piece_moved.connect($Sounds/Move.play)
	piece_rotated.connect($Sounds/Rotate.play)
	piece_held.connect($Sounds/Hold.play)
	piece_locked.connect($Sounds/Lock.play)
	lines_cleared.connect(_on_lines_cleared)
	leveled_up.connect($Sounds/LevelUp.play.unbind(1))
	topped_out.connect($Sounds/TopOut.play)

	board.show_ghost = Settings.ghost_piece
```

Then emit each signal where its event happens:

```gdscript title="game.gd" ins={6-7,18,27,34,43,51,56,66,70-75}
func _try_move(offset: Vector2i) -> bool:
	var moved := piece.moved(offset)
	if not board.fits(moved):
		return false
	_set_piece(moved)
	if offset.x != 0:
		piece_moved.emit()
	return true


## Turn the piece, trying each wall kick in turn until one fits.
func _rotate(direction: int) -> void:
	var turned := piece.rotated(direction)
	for kick in piece.kicks(direction):
		var kicked := turned.moved(kick)
		if board.fits(kicked):
			_set_piece(kicked)
			piece_rotated.emit()
			return

# ...

func hard_drop() -> void:
	var distance := board.drop_distance(piece)
	piece = piece.moved(Vector2i(0, distance))
	_add_score(distance * 2)
	hard_dropped.emit(distance)
	_lock_piece()

# ...

	hold_type = held
	hud.update_hold(hold_type, can_hold)
	piece_held.emit()


func _lock_piece() -> void:
	lock_timer.stop()
	gravity_timer.stop()
	var locked := piece
	piece = null
	var inside := board.lock_piece(locked)
	piece_locked.emit()
	if not inside:

# ...

func _score_lines(count: int) -> void:
	lines += count
	score += LINE_SCORES[count] * level
	lines_cleared.emit(count)
	@warning_ignore("integer_division")
	var new_level := lines / LINES_PER_LEVEL + 1
	if new_level > level:
		level = new_level
		leveled_up.emit(level)
	hud.update_stats(score, level, lines)

# ...

func _game_over() -> void:
	piece = null
	gravity_timer.stop()
	lock_timer.stop()
	board.modulate = Color(0.5, 0.5, 0.55) # Grey out the stack.
	topped_out.emit()
	pause_menu.set_process_unhandled_input(false)
	var rank := HighScores.submit(score, lines, level)
	game_over.show_result(score, rank)


func _on_lines_cleared(count: int) -> void:
	# Same sound, higher pitch for bigger clears.
	$Sounds/Clear.pitch_scale = 1.0 + 0.15 * (count - 1)
	$Sounds/Clear.play()
```

A few things worth understanding:

- **`$Sounds/Move.play` without parentheses** is a **Callable**: a reference to the method, not a call. `connect` stores it and calls it whenever the signal fires.
- **`.unbind(1)`**: `leveled_up` passes one argument (the new level), but `play()` doesn't want it (its optional parameter is a start position, and a level number would make it skip ahead). `unbind(1)` makes a callable that drops the last argument before calling `play()`.
- **Only sideways moves click.** `_try_move` also runs for gravity and soft drop; a click on every row would be noise.
- **Pitch for bigger clears.** `_on_lines_cleared` reuses one sound at a higher `pitch_scale` for two, three or four lines (×1.15, ×1.3, ×1.45). A four-line clear sounds noticeably brighter without a separate file.
- `hard_dropped` isn't connected to anything yet. The lock sound already plays when a hard-dropped piece locks; the screen shake on the last page of this chapter will listen to it.

This is the payoff of signals: `game.gd` has no idea how many listeners it has. You could delete the `Sounds` node's connections and nothing would break.

```quiz
question: What's the difference between `$Sounds/Move.play` and `$Sounds/Move.play()`?
options:
  - None
  - The first is a reference to the method (a Callable), the second calls it immediately
  - The first plays the sound on the next frame
answer: 1
```

```quiz
question: Why does the `leveled_up` connection use `.unbind(1)`?
options:
  - To disconnect the signal after it fires once
  - To drop the level argument, which play() would otherwise receive as its start position
  - Because signals with arguments can't connect to methods
answer: 1
```
