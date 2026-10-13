---
title: The marching beat
description: Four descending notes, one per step, speeding up with the formation.
estimatedMinutes: 10
---

The most famous sound in Space Invaders isn't an explosion. It's the four bass notes that thud along with the march, *dum, dum, dum, dum*, getting faster and faster as the formation thins out. It was one of the first game soundtracks that changed with the action, and it costs us almost nothing: the formation already steps faster, so if every step plays the next note, the beat speeds up by itself.

## The formation announces its steps

```gdscript title="formation.gd" ins={2}
signal invader_killed(invader: Invader)
signal stepped
signal cleared
signal landed
```

At the very end of `_on_step_timer_timeout`, after the invaders have moved:

```gdscript title="formation.gd" ins={22}
func _on_step_timer_timeout() -> void:
	# Measure the formation using only the invaders still alive.
	var left := INF
	var right := -INF
	var bottom := -INF
	for invader in _invaders:
		left = minf(left, invader.global_position.x)
		right = maxf(right, invader.global_position.x)
		bottom = maxf(bottom, invader.global_position.y)
	var next_left := left + STEP * _direction
	var next_right := right + STEP * _direction
	if next_left < MARGIN or next_right > get_viewport_rect().size.x - MARGIN:
		# The next step would cross the edge: drop down and turn around instead.
		position.y += DROP
		_direction = -_direction
		if bottom + DROP >= LANDING_Y:
			landed.emit()
	else:
		position.x += STEP * _direction
	for invader in _invaders:
		invader.step()
	stepped.emit()
```

## The game plays the notes

Add a fifth player to `Sounds` named `March`, on the `SFX` bus. Give it `march_1.wav` so it isn't empty; the code swaps the stream on every step.

```gdscript title="game.gd" ins={3-8}
const EXPLOSION_SCENE := preload("res://explosion.tscn")
const UFO_SCENE := preload("res://ufo.tscn")
const MARCH_NOTES: Array[AudioStream] = [
	preload("res://sounds/march_1.wav"),
	preload("res://sounds/march_2.wav"),
	preload("res://sounds/march_3.wav"),
	preload("res://sounds/march_4.wav"),
]
```

```gdscript title="game.gd" ins={6}
var score := 0
var high_score := 0
var lives := 3
var wave := 1
var _extra_life_awarded := false
var _march_note := 0
```

Connect the formation's `stepped` signal to `Game`:

```gdscript title="game.gd"
func _on_formation_stepped() -> void:
	# One note per step: as the steps speed up, so does the beat.
	$Sounds/March.stream = MARCH_NOTES[_march_note]
	$Sounds/March.play()
	_march_note = (_march_note + 1) % MARCH_NOTES.size()
```

`% MARCH_NOTES.size()` wraps the index: 0, 1, 2, 3, 0, 1... The notes fall by a semitone each, so the loop sounds like a descending bass line that never resolves. Very tense.

Run the game and listen. With a full formation the beat is a slow, heavy walk; with a handful of invaders left it's a gallop.

:::note
The beat stops whenever the formation does: during the wave banner, while you respawn, and when the game is over. Nothing extra to code: no steps, no notes.
:::

```quiz
question: Where does the beat's speed-up come from?
options:
  - A tween that raises the pitch
  - The step interval: one note plays per step, and steps get faster as invaders die
  - Four different sound files at different tempos
answer: 1
```
