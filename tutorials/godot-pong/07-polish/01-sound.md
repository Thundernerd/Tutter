---
title: Sound effects
description: AudioStreamPlayers on the SFX bus, triggered by signals.
estimatedMinutes: 15
---

## Get some sounds

Download the three blips used in this tutorial: [pong-sounds.zip](./files/pong-sounds.zip). Unzip it into a `sounds/` folder in your project. Godot imports `.wav` files automatically.

Want your own? [jsfxr](https://sfxr.me) generates retro sound effects in the browser: try the *Blip/Select* and *Pickup/Coin* presets.

## Players

Add a plain `Node` named `Sounds` to `game.tscn` (just a folder for tidiness) with three `AudioStreamPlayer` children:

| Node | Stream | Bus |
| --- | --- | --- |
| `PaddleHit` | `paddle_hit.wav` | `SFX` |
| `WallHit` | `wall_hit.wav` | `SFX` |
| `Score` | `score.wav` | `SFX` |

Setting **Bus** to `SFX` is what makes the effects slider work. Also give the options screen's `TestSound` the `paddle_hit.wav` stream.

:::note
`AudioStreamPlayer` plays at the same volume everywhere. `AudioStreamPlayer2D` gets quieter and pans with distance from the camera, which is great for big levels but overkill on a single screen.
:::

## Wire them to the signals

Remember the `hit_paddle` and `hit_wall` signals on the ball? Connect them in code:

```gdscript title="game.gd" ins={2-3,9}
func _ready() -> void:
	ball.hit_paddle.connect($Sounds/PaddleHit.play)
	ball.hit_wall.connect($Sounds/WallHit.play)
	# ...


func _score(player: int) -> void:
	scores[player] += 1
	$Sounds/Score.play()
	# ...
```

`$Sounds/PaddleHit.play` without parentheses is a **Callable**: a reference to the method, not a call. `connect` stores it and calls it whenever the signal fires.

This is the payoff of signals: the ball has no idea sounds exist. You could remove the `Sounds` node entirely and nothing would break.

```quiz
question: What's the difference between `$Sounds/Score.play` and `$Sounds/Score.play()`?
options:
  - None
  - The first is a reference to the method (a Callable), the second calls it immediately
  - The first plays the sound on the next frame
answer: 1
```
