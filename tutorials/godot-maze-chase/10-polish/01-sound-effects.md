---
title: Sound effects
description: AudioStreamPlayers on the SFX bus, a "waka" that doesn't stutter, and a start jingle.
estimatedMinutes: 20
---

## Get the sounds

Download the sound pack: [maze-muncher-sounds.zip](./files/maze-muncher-sounds.zip). Unzip it into your project to get a `sounds/` folder. Godot imports `.wav` files automatically.

| File | Plays when |
| --- | --- |
| `chomp.wav` | eating pellets (the "waka") |
| `eat_ghost.wav` | catching a frightened ghost |
| `eat_fruit.wav` | eating the bonus fruit |
| `extra_life.wav` | reaching 10,000 points |
| `start.wav` | the "READY!" pause at the start of a game |
| `death.wav` | getting caught |
| `siren.wav`, `power.wav` | looping in the background (next page) |

They were generated with a small Python script (included in the zip) that writes simple square and triangle waves with Python's built-in `wave` module. To make your own, [jsfxr](https://sfxr.me) generates retro sound effects in the browser.

## Players

Add a plain `Node` named `Sounds` under `Game` (just a folder) with an `AudioStreamPlayer` child for each sound:

| Node | Stream |
| --- | --- |
| `Chomp` | `chomp.wav` |
| `EatGhost` | `eat_ghost.wav` |
| `EatFruit` | `eat_fruit.wav` |
| `ExtraLife` | `extra_life.wav` |
| `Death` | `death.wav` |
| `Start` | `start.wav` |

Set **Bus** to `SFX` on every one of them: that's what makes the effects volume slider work. Also give the options screen's `TestSound` the `chomp.wav` stream.

`Sounds` sits under `Game`, not `World`, so the sounds don't stop when the world freezes. The ghost-eaten sound plays *during* the eat freeze, and the death sound during the death animation.

## Playing them

Most sounds are one line, next to the code that causes them:

```gdscript title="game.gd"
	# in _eat_ghost, after ghost.eat():
	$Sounds/EatGhost.play()

	# in _eat_fruit, after _add_score(points):
	$Sounds/EatFruit.play()
```

and the extra life:

```gdscript title="game.gd" ins={7}
func _add_score(points: int) -> void:
	var before := score
	score += points
	if before < EXTRA_LIFE_SCORE and score >= EXTRA_LIFE_SCORE:
		lives += 1
		hud.update_lives(lives)
		$Sounds/ExtraLife.play()
	hud.update_score(score)
```

### The waka

The classic eating sound alternates two tones as the player munches through a line of pellets. Each pellet takes about 0.14 seconds to cross, and `chomp.wav` is one 0.14-second "wa-ka". If we called `play()` for every pellet, any small timing difference would restart the sound mid-way and it would stutter. So only start it when it isn't already playing:

```gdscript title="game.gd" ins={3-4}
func _on_player_ate_pellet(power: bool) -> void:
	_add_score(50 if power else 10)
	if not $Sounds/Chomp.playing:
		$Sounds/Chomp.play()
```

Eating a row of pellets now gives a steady "waka waka waka", and it stops as soon as you stop eating.

### The start jingle

The arcade games played a tune before the first round only, not after every lost life. A flag remembers whether this is the first round:

```gdscript title="game.gd" ins={1,7-9}
var _first_round := true


func _start_round() -> void:
	# ...
	hud.show_ready(true)
	if _first_round:
		$Sounds/Start.play()
		_first_round = false
	await _wait(2.0)
```

The jingle is just under two seconds, the length of the "READY!" pause.

:::note[AudioStreamPlayer vs AudioStreamPlayer2D]
`AudioStreamPlayer` plays at the same volume everywhere. `AudioStreamPlayer2D` pans and fades with distance from the camera, which is great for big levels but pointless on a single screen.
:::

```quiz
question: Why does the chomp sound only play when it isn't already playing?
options:
  - AudioStreamPlayer can't restart a sound
  - Restarting it for every pellet would cut it off mid-way and make it stutter
  - To save memory
answer: 1
```

```quiz
question: Why are the sound players under Game rather than under World?
options:
  - Sounds must be direct children of the scene root
  - So they keep playing while World is frozen, e.g. during the eat-ghost pause and the death animation
  - World can't contain non-2D nodes
answer: 1
```
