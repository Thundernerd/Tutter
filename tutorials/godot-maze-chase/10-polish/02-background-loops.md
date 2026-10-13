---
title: The siren and power mode
description: Looping sounds that follow the game state, and a siren that rises as the maze empties.
estimatedMinutes: 20
---

Maze games are never silent while you play: a **siren** wails in the background, and while the ghosts are blue it's replaced by a frantic **power mode** loop. Both stop during freezes.

## Looping WAV files

Add two more players under `Sounds`, both on the `SFX` bus:

| Node | Stream |
| --- | --- |
| `Siren` | `siren.wav` |
| `Power` | `power.wav` |

A sound only loops if its import settings say so. Select `siren.wav` in the FileSystem dock, open the **Import** dock (next to the Scene dock), and look at **Edit → Loop Mode**:

| Loop Mode | Meaning |
| --- | --- |
| Detect From WAV | Loop if the file itself contains loop points (the default) |
| Disabled | Never loop |
| Forward | Loop the whole file (or between Loop Begin and Loop End) |

The two files in the sound pack contain loop points, so the default already loops them. For your own sounds, choose **Forward** and click **Reimport**.

:::tip
Import settings live in `.import` files next to each asset (`siren.wav.import`). Commit them along with your project, or your loop settings won't travel with it.
:::

## Following the game state

Which loop should play depends only on the current state:

| State | Siren | Power |
| --- | --- | --- |
| Playing, ghosts normal | ▶ | |
| Playing, ghosts frightened | | ▶ |
| Frozen (READY!, death, eat pause, level clear) | | |

Rather than remembering to start and stop the loops at every event, `game.gd` checks the table every frame and fixes whatever doesn't match:

```gdscript title="game.gd"
@onready var siren: AudioStreamPlayer = $Sounds/Siren
@onready var power_sound: AudioStreamPlayer = $Sounds/Power


## Keeps the siren or the power-mode sound looping while the game runs.
func _update_loops() -> void:
	var powered := playing and not fright_timer.is_stopped()
	_play_if(siren, playing and not powered)
	_play_if(power_sound, powered)
	# The siren rises as the maze empties.
	siren.pitch_scale = 1.0 + 0.5 * (1.0 - float(maze.pellets_left) / maze.pellets_total)


func _play_if(sound: AudioStreamPlayer, on: bool) -> void:
	if on and not sound.playing:
		sound.play()
	elif not on and sound.playing:
		sound.stop()
```

Call it at the very top of `_physics_process`, **before** the `if not playing: return` line, so the loops also get switched off while the world is frozen:

```gdscript title="game.gd" ins={2}
func _physics_process(_delta: float) -> void:
	_update_loops()
	if not playing:
		return
```

- **`fright_timer.is_stopped()`** is true when no fright is running. The fright timer is the single source of truth for "are the ghosts blue?".
- **Pitch** goes from 1.0 with a full maze to 1.5 with an empty one. The siren creeping up in pitch is a subtle, effective way to build tension towards the end of a level. `float()` matters: `pellets_left / pellets_total` with two integers would be integer division, always 0 until the very end.
- **`_play_if`** only calls `play()` or `stop()` when something needs to change, so calling it every frame costs nothing and never restarts a sound that's already playing.

This "describe the desired state, then correct reality" approach is sometimes called **reconciling**. It's more robust than event-driven start/stop calls: there's no way to forget a `stop()` on some rare path (pausing mid-freeze, quitting from the level clear screen), because the next frame fixes it.

```quiz
question: 'Why is `_update_loops()` called before `if not playing: return`?'
options:
  - So the loops are stopped while the world is frozen too
  - It must be the first line of any _physics_process
  - Because `playing` is set by `_update_loops`
answer: 0
```

```quiz
question: In a maze with 300 pellets in total and 60 left, what is the siren's pitch scale?
type: text
answer: ["1.4", "1.40"]
hint: 60 / 300 = 0.2
explain: 1.0 + 0.5 × (1 − 0.2) = 1.4
```
