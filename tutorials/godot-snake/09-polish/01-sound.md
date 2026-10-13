---
title: Sound effects
description: AudioStreamPlayers on the SFX bus, and declaring your own signal.
estimatedMinutes: 15
---

## Get some sounds

Download the three sounds used in this tutorial: [snake-sounds.zip](./files/snake-sounds.zip). Unzip it into your project folder so you get a `sounds/` folder with `eat.wav`, `turn.wav` and `crash.wav`. Godot imports `.wav` files automatically.

Want to make your own? [jsfxr](https://sfxr.me) generates retro sound effects in the browser; try the *Pickup/Coin* and *Explosion* presets.

## Players

Add a plain `Node` named `Sounds` to `game.tscn`, just to keep things tidy, with three `AudioStreamPlayer` children:

| Node | Stream | Bus |
| --- | --- | --- |
| `Eat` | `eat.wav` | `SFX` |
| `Turn` | `turn.wav` | `SFX` |
| `Crash` | `crash.wav` | `SFX` |

Drag each `.wav` from the FileSystem dock onto the player's **Stream** property. Setting **Bus** to `SFX` is what makes the effects volume slider work. While you're at it, give the options screen's `TestSound` the `eat.wav` stream too.

:::note
`AudioStreamPlayer` plays at the same volume everywhere. `AudioStreamPlayer2D` gets quieter and pans left or right depending on where it is on screen, which is great for big levels but not needed here.
:::

## Eating and crashing

The game knows when these happen, so it plays them directly:

```gdscript title="game.gd" ins={4}
func _eat() -> void:
	score += 1
	hud.update_score(score)
	$Sounds/Eat.play()
	_update_speed()
	_place_food()
```

```gdscript title="game.gd" ins={5}
func _game_over() -> void:
	move_timer.stop()
	snake.set_process_unhandled_input(false)
	pause_menu.set_process_unhandled_input(false)
	$Sounds/Crash.play()
	var new_best := HighScore.submit(score)
```

## Turning: your own signal

The turn click is different. Only the snake knows when a turn is accepted (a reversal, or a third quick press when two turns are already queued, is ignored and should make no sound). We could make the snake find the sound player and play it, but then `snake.gd` would depend on how the game scene is built.

Instead, the snake announces "I turned!" with a **signal** of its own, and whoever cares can listen. Declare it at the top of `snake.gd` and emit it when a turn joins the queue:

```gdscript title="snake.gd" ins={5-7}
class_name Snake
extends Node2D
## The snake: a list of grid cells, head first.

## Emitted when a turn is accepted into the queue.
signal turned

## How many turns can wait for the next moves.
const MAX_QUEUED_TURNS := 2
```

```gdscript title="snake.gd" ins={3}
	if _queued_turns.size() < MAX_QUEUED_TURNS:
		_queued_turns.append(new_direction)
		turned.emit()
```

Then connect it in the game, in code this time:

```gdscript title="game.gd" ins={4}
func _ready() -> void:
	board.walls_solid = not Settings.wrap_around
	snake.reset(START_CELL, START_LENGTH)
	snake.turned.connect($Sounds/Turn.play)
	hud.update_score(score)
```

`$Sounds/Turn.play` without parentheses is a **Callable**: a reference to the function, not a call. `connect` stores it and calls it every time the snake emits `turned`.

The snake still has no idea sounds exist. Delete the `Sounds` node and the snake works exactly the same; that's what signals are for. The timer's `timeout` and the buttons' `pressed` work the same way, now you've made one yourself.

Run the game with the sound on: a soft tick on every turn, a blip for every bite, and a crunch when it all goes wrong.

```quiz
question: What's the difference between `$Sounds/Turn.play` and `$Sounds/Turn.play()`?
options:
  - None
  - The first is a reference to the function (a Callable); the second calls it right away
  - The first plays the sound on the next frame
answer: 1
```

```quiz
question: Why does the snake emit a signal instead of playing the turn sound itself?
options:
  - Snakes can't play sounds
  - So the snake doesn't depend on how the game scene is built; anyone can listen to the signal
  - Signals are faster than function calls
answer: 1
```
