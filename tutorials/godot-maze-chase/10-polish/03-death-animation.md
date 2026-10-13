---
title: The death animation
description: A one-shot animation that plays while the rest of the world stays frozen.
estimatedMinutes: 15
---

Right now the player simply vanishes when caught. The arcade classics made it a little show: the player turns to face up, its mouth opens wider and wider until nothing is left, and it pops.

## The animation

Open `player.tscn`, select `Sprite`, and add a second animation to its SpriteFrames, named `die`:

1. Add all 11 frames from `art/player_death.png` (an 11×1 sheet).
2. Set the speed to `8` FPS.
3. Turn **Loop** off.

At 8 frames per second, 11 frames take about 1.4 seconds. With looping off, the `AnimatedSprite2D` stops on the last frame (which is empty) and emits `animation_finished`.

## Playing it while frozen

Here's the catch: when the player dies, `World` is disabled, so `Player` and its `Sprite` can't process, and a sprite that can't process doesn't animate.

The fix is one line. A node with an **explicit** process mode ignores its parent's: setting the sprite to **Pausable** means "process unless the game is paused", regardless of `World` being disabled. Add this to `player.gd`:

```gdscript title="player.gd"
## Plays the death animation. The rest of the world is frozen while it runs.
func die() -> void:
	sprite.process_mode = Node.PROCESS_MODE_PAUSABLE # Animate even though our parent is disabled.
	sprite.rotation = 0.0
	sprite.play(&"die")
	await sprite.animation_finished
	sprite.process_mode = Node.PROCESS_MODE_INHERIT
	sprite.hide()
```

- Only the **sprite** gets the exception, not the `Player` node. Otherwise `_physics_process` would run too, and the player would keep moving while dying.
- **`rotation = 0.0`**: the death frames are drawn facing up, so undo the facing rotation.
- **`await sprite.animation_finished`** makes `die()` itself a coroutine: it returns when the animation is done. After it, the sprite goes back to inheriting, and hides. `reset()` already shows it again and plays `move`.
- Because the exception is *Pausable* rather than *Always*, pausing the game mid-death still freezes the animation.

## Using it

In `game.gd`, replace the placeholder in `_lose_life`, and play the death sound with it:

```gdscript title="game.gd" del={7-8} ins={9-10}
func _lose_life() -> void:
	_set_world_running(false)
	await _wait(1.0)
	for ghost: Ghost in ghosts:
		ghost.hide()
	fruit.hide()
	player.sprite.hide()
	await _wait(1.0)
	$Sounds/Death.play()
	await player.die()
	lives -= 1
	hud.update_lives(lives)
	if lives == 0:
		_game_over()
		return
	await _wait(0.5)
	_start_round()
```

`await player.die()` waits for the whole animation, because `die()` itself awaits `animation_finished`. Coroutines compose: awaiting a function that awaits something waits for all of it.

```quiz
question: Why does the sprite get process mode Pausable during the death animation?
options:
  - Pausable is faster than Inherit
  - An explicit mode overrides the disabled World, so the sprite can animate while everything else stays frozen
  - So the animation can't be paused
answer: 1
```

```quiz
question: What would go wrong if `die()` set the process mode on the Player node instead of the sprite?
options:
  - Nothing
  - The player's _physics_process would run, and it would keep moving during the animation
  - The animation would play twice
answer: 1
```
