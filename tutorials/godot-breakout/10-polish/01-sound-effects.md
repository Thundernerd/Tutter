---
title: Sound effects
description: AudioStreamPlayers on the SFX bus, triggered by the signals we already have.
estimatedMinutes: 15
---

## Get the sounds

Download the seven blips used in this tutorial, [breakout-sounds.zip](./files/breakout-sounds.zip), and unzip it into your project so you get a `sounds/` folder. Godot imports `.wav` files automatically.

Want your own? [jsfxr](https://sfxr.me) makes retro sound effects in the browser. The *Blip/Select*, *Hit/Hurt* and *Powerup* presets are good starting points.

## Players

Add a plain `Node` named `Sounds` to `game.tscn` (a folder, for tidiness), with seven `AudioStreamPlayer` children. Set every player's **Bus** to `SFX`, which is what makes the effects volume slider work:

| Node | Stream | Played when |
| --- | --- | --- |
| `PaddleHit` | `paddle_hit.wav` | the ball hits the paddle |
| `WallHit` | `wall_hit.wav` | the ball hits a wall |
| `BrickHit` | `brick_hit.wav` | a brick survives a hit (silver, steel) |
| `BrickBreak` | `brick_break.wav` | a brick breaks. Set **Max Polyphony** to `4` |
| `PowerUp` | `power_up.wav` | a pickup is caught |
| `LoseLife` | `lose_life.wav` | the last ball is lost |
| `LevelClear` | `level_clear.wav` | the last brick breaks |

An `AudioStreamPlayer` normally plays one sound at a time: playing it again restarts it. With three balls, bricks can break a few frames apart, and each new break would cut off the last one. **Max Polyphony** `4` lets up to four overlap.

Also give the options screen's `TestSound` the `brick_hit.wav` stream, so the effects slider makes a sound.

:::note
`AudioStreamPlayer` plays at the same volume everywhere. `AudioStreamPlayer2D` gets quieter and pans left or right with distance from the camera. On a single screen, the plain one is all you need.
:::

## Wire them up

Remember `hit_paddle` and `hit_wall` on the ball? Balls are created in code, so connect them in code, when each ball is spawned. Connect the `Bricks` node's `brick_damaged` signal to `Game` in the editor, and play the rest where they happen:

```gdscript title="game.gd" ins={3-4,12,17-20,23,29,34}
func _spawn_ball() -> CharacterBody2D:
	var ball: CharacterBody2D = BALL_SCENE.instantiate()
	ball.hit_paddle.connect($Sounds/PaddleHit.play)
	ball.hit_wall.connect($Sounds/WallHit.play)
	balls.add_child(ball)
	return ball


func _on_kill_zone_body_entered(body: Node2D) -> void:
	# ...
	hud.update_lives(lives)
	$Sounds/LoseLife.play()
	if lives == 0:
		_end_game(false)


func _on_bricks_brick_damaged(_brick: Node2D) -> void:
	$Sounds/BrickHit.play()


func _on_bricks_brick_destroyed(brick: Node2D) -> void:
	_add_points(brick.type.points)
	$Sounds/BrickBreak.play()
	if randf() < drop_chance:
		_spawn_pickup(brick.global_position)


func _on_bricks_cleared() -> void:
	$Sounds/LevelClear.play()
	if level_index + 1 < levels.size():


func _on_pickup_collected(kind: Pickup.Kind) -> void:
	$Sounds/PowerUp.play()
	match kind:
```

`$Sounds/PaddleHit.play` without parentheses is a **Callable**: a reference to the method, not a call. `connect` keeps it and calls it every time the signal fires.

This is where signals pay off: the ball still has no idea sounds exist, and the bricks don't either. Delete the `Sounds` node's players and everything keeps working, silently.

```quiz
question: Three bricks break within a few frames of each other, and BrickBreak has the default Max Polyphony of 1. What do you hear?
options:
  - Three overlapping sounds
  - Each new sound cuts off the previous one
  - Only the first sound
answer: 1
```

```quiz
question: What's the difference between `$Sounds/WallHit.play` and `$Sounds/WallHit.play()`?
options:
  - None
  - The first is a Callable (a reference to the method); the second calls it right now
  - The first plays the sound on the next frame
answer: 1
```
