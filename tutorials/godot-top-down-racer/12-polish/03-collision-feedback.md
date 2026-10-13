---
title: Collision feedback
description: A bumped signal, a thud, a flash, and a camera shake for the players.
estimatedMinutes: 15
---

Hitting a mug should *feel* like hitting a mug. Three cues, all triggered by one signal:

1. A **thud**, louder for harder hits.
2. A quick white **flash** on the car.
3. A **camera shake**, but only when a player's car is hit. Shaking the shared screen for every CPU scrape would get old fast.

## The bumped signal

The car already measures the impact speed of every collision. It just needs to tell the world about the hard ones:

```gdscript title="car.gd" ins={1-2,13-14}
## Emitted when the car hits something hard. `strength` is the impact speed in px/s.
signal bumped(strength: float)

# ...

func _handle_collisions(impact_velocity: Vector2) -> void:
	for i in get_slide_collision_count():
		# ...
		else:
			velocity += normal * impact * 0.3 # A small bounce off walls and props.
			if other is Prop:
				velocity += normal * other.bounce
		if impact > 60.0:
			bumped.emit(impact)
```

Below 60 px/s, scraping along a wall stays quiet. That's important, because sliding along the table edge reports a tiny collision every tick.

## Sound and flash

Add a third `AudioStreamPlayer2D`, `BumpSound` (stream `bump.wav`, max distance `2000`, bus `SFX`). The car listens to its own signal:

```gdscript title="car.gd" ins={1,6,10-16}
@onready var bump_sound: AudioStreamPlayer2D = $BumpSound


func _ready() -> void:
	$Visuals/Body.color = color
	bumped.connect(_on_bumped)
	# ...


## A knock sound and a short flash. The race also listens to `bumped` to shake the camera.
func _on_bumped(strength: float) -> void:
	bump_sound.pitch_scale = randf_range(0.8, 1.2)
	bump_sound.volume_db = linear_to_db(clampf(strength / 200.0, 0.3, 1.0))
	bump_sound.play()
	visuals.modulate = Color(1.8, 1.8, 1.8)
	create_tween().tween_property(visuals, "modulate", Color.WHITE, 0.15)
```

- A random pitch between 0.8 and 1.2 means repeated bumps don't sound like a machine gun of identical thuds. It's the cheapest trick in game audio.
- Volume scales with the impact: a 200 px/s crash is full volume, a light tap 30%.
- `modulate` multiplies the car's colours; values above 1 brighten them. Tweening back to white over 0.15 s is a flash. Only `Visuals` flashes, not the shadow.

Why connect a signal to yourself instead of calling `_on_bumped()` directly? Because the car isn't the only listener. Everything that cares about bumps (sound, flash, camera) hooks into one signal, and the collision code doesn't need to know any of them exist.

## Shaking the camera

The race connects each **player's** car to the camera's `shake()`, which we wrote in chapter 7:

```gdscript title="race.gd" ins={8,13-14}
func _spawn_cars() -> void:
	# ...
		else:
			var player := slot - cpu_count
			car.driver_name = "P%d" % (player + 1)
			car.color = PLAYER_COLORS[player]
			car.input_prefix = "p%d" % (player + 1)
			car.bumped.connect(_on_player_bumped)
			players.append(car)
	# ...


func _on_player_bumped(strength: float) -> void:
	camera.shake(minf(strength / 40.0, 6.0))
```

A 240 px/s head-on crash shakes the screen by up to 6 px, and the camera's `_shake` value decays back to zero in a fraction of a second. The HUD sits on a `CanvasLayer`, so the numbers stay rock steady while the table shakes.

## Done!

That's the whole game: drift around three tables, race the CPU or a friend, fight a head-to-head duel, win a championship, and chase your lap records. One chapter left: sharing it.

```quiz
question: Why does `_handle_collisions` only emit `bumped` above 60 px/s?
options:
  - Sliding along a wall reports small collisions every tick, which would play the thud constantly
  - Signals can't carry small numbers
  - Godot ignores collisions below 60 px/s
answer: 0
```

```quiz
type: multiple
question: Which of these listen to a player car's `bumped` signal? Select all that apply.
options:
  - The car itself (sound and flash)
  - The race, which shakes the camera
  - The HUD
  - The AI driver
answer: [0, 1]
```
