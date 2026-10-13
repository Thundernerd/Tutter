---
title: Sound effects
description: AudioStreamPlayers on the SFX bus, triggered by signals, and a looping UFO hum.
estimatedMinutes: 20
---

## Get the sounds

Download the effects used in this tutorial: [space-invaders-sounds.zip](./files/space-invaders-sounds.zip). Unzip it into your project so you get a `sounds/` folder. Godot imports `.wav` files automatically.

| File | Plays when |
| --- | --- |
| `shoot.wav` | the player fires |
| `invader_killed.wav` | an invader explodes |
| `player_explosion.wav` | the player is hit |
| `extra_life.wav` | the bonus life is awarded |
| `ufo.wav` | the mystery ship is flying (looped) |
| `ufo_hit.wav` | the mystery ship is shot |
| `march_1.wav` … `march_4.wav` | the formation steps (next page) |

Want your own? [jsfxr](https://sfxr.me) generates retro sound effects in the browser: try the *Laser/Shoot*, *Explosion* and *Powerup* presets.

## Players in the game

Add a plain `Node` named `Sounds` to `game.tscn` (just a folder for tidiness) with four `AudioStreamPlayer` children:

| Node | Stream | Bus |
| --- | --- | --- |
| `Shoot` | `shoot.wav` | `SFX` |
| `InvaderKilled` | `invader_killed.wav` | `SFX` |
| `PlayerExplosion` | `player_explosion.wav` | `SFX` |
| `ExtraLife` | `extra_life.wav` | `SFX` |

Setting **Bus** to `SFX` is what makes the effects slider work. Also give the options screen's `TestSound` the `shoot.wav` stream.

:::note
`AudioStreamPlayer` plays at the same volume everywhere. `AudioStreamPlayer2D` gets quieter and pans with distance from the camera, which is great for big levels but overkill on a single screen.
:::

## The player announces its shots

The player shouldn't play sounds itself; it doesn't know about the `Sounds` node. It emits a signal instead:

```gdscript title="player.gd" ins={4}
extends Area2D
## The player's laser cannon. Moves along the bottom and fires one shot at a time.

signal shot_fired
signal died
```

```gdscript title="player.gd" ins={5}
func _shoot() -> void:
	_shot_in_flight = SHOT_SCENE.instantiate()
	_shot_in_flight.position = position + Vector2(0, -12)
	add_sibling(_shot_in_flight)
	shot_fired.emit()
```

## The game plays them

```gdscript title="game.gd" ins={7}
func _ready() -> void:
	lives = Settings.starting_lives
	high_score = HighScore.load_best()
	hud.set_score(score)
	hud.set_high_score(high_score)
	hud.set_lives(lives)
	player.shot_fired.connect($Sounds/Shoot.play)
	_start_wave()
```

`$Sounds/Shoot.play` without parentheses is a **Callable**: a reference to the method, not a call. `connect` stores it and calls it whenever the signal fires.

The other three go where the events already happen:

```gdscript title="game.gd" ins={4,12}
func _on_formation_invader_killed(invader: Invader) -> void:
	_add_score(invader.get_points())
	_spawn(EXPLOSION_SCENE, invader.global_position)
	$Sounds/InvaderKilled.play()


func _on_player_died() -> void:
	lives -= 1
	hud.set_lives(lives)
	formation.stop()
	_clear_shots()
	$Sounds/PlayerExplosion.play()
	# ...
```

```gdscript title="game.gd" ins={11}
func _add_score(points: int) -> void:
	score += points
	hud.set_score(score)
	if score > high_score:
		high_score = score
		hud.set_high_score(high_score)
	if not _extra_life_awarded and score >= EXTRA_LIFE_SCORE:
		_extra_life_awarded = true
		lives += 1
		hud.set_lives(lives)
		$Sounds/ExtraLife.play()
```

## The UFO's hum

The mystery ship carries its own sounds, so they start and stop with it. Add two `AudioStreamPlayer`s to `ufo.tscn`:

| Node | Stream | Bus | Other |
| --- | --- | --- | --- |
| `FlySound` | `ufo.wav` | `SFX` | **Autoplay** on |
| `HitSound` | `ufo_hit.wav` | `SFX` | |

`ufo.wav` is a short warble that should repeat for as long as the ship flies. Connect `FlySound`'s `finished` signal to `FlySound` itself, picking its `play()` method: every time the sound ends, it starts again. When the UFO is freed, its sounds go with it.

:::tip[Import looping]
You can also loop a WAV in the **Import** dock: select the file, set **Edit → Loop Mode** to **Forward** and click **Reimport**. The signal trick works with any sound and keeps the setting visible in the scene.
:::

When hit, the UFO swaps the hum for a crash:

```gdscript title="ufo.gd" ins={10-11}
func hit(_shot: Area2D) -> bool:
	if _dead:
		return false # Already showing its score: let the shot pass.
	_dead = true
	var points: int = POINTS.pick_random()
	destroyed.emit(points)
	sprite.hide()
	score_label.text = str(points)
	score_label.show()
	$FlySound.stop()
	$HitSound.play()
	remove_timer.start()
	return true
```

The `RemoveTimer` waits a full second, long enough for `ufo_hit.wav` to finish before the node is freed.

```quiz
question: What's the difference between `$Sounds/Shoot.play` and `$Sounds/Shoot.play()`?
options:
  - None
  - The first is a reference to the method (a Callable), the second calls it immediately
  - The first plays the sound on the next frame
answer: 1
```

```quiz
question: 'You pause the game while the UFO flies. What happens to its hum?'
options:
  - It keeps playing
  - It pauses with the UFO, because sound players follow their node's process mode
  - It restarts from the beginning
answer: 1
```
