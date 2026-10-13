---
title: Off the road
description: Distance to the curve decides where the road is, and the table slows you down.
estimatedMinutes: 20
---

## Where is the road?

We never stored the road's shape: only its centre line and its width. That's enough. A point is on the road if it's within half a road width (plus the kerb) of the centre line:

```gdscript title="track.gd"
func distance_from_centre(point: Vector2) -> float:
	return point.distance_to(curve.get_closest_point(point))


func is_off_road(point: Vector2) -> bool:
	return distance_from_centre(point) > road_width / 2.0 + kerb_width
```

`get_closest_point` finds the nearest spot on the curve. The kerbs count as road, so you can clip them on the inside of a corner without losing speed, as on a real circuit.

## Surface factors

Off-road, the car should be slower and slide more. Rather than sprinkling `if off_road` through the handling code, we ask one question at the start of `_drive()`: *what's under the car?* The answer is two multipliers, packed into a `Vector2`: `x` for top speed and `y` for grip.

Add to `car.gd`:

```gdscript title="car.gd" ins={1-5,7-8,10}
@export_group("Off-road")
## Top speed multiplier off the road.
@export var off_road_speed := 0.45
## Grip multiplier off the road.
@export var off_road_grip := 0.6

## The track the car is racing on, used for off-road checks and skid marks.
var track: Track

var off_road := false
```

and a new function:

```gdscript title="car.gd"
## How the ground under the car changes it: x multiplies top speed, y multiplies grip.
func _surface_factors() -> Vector2:
	off_road = false
	if track and track.is_off_road(global_position):
		off_road = true
		return Vector2(off_road_speed, off_road_grip)
	return Vector2.ONE
```

Then use the factors in `_drive()`:

```gdscript title="car.gd" ins={2-3,13,16-18,21} del={1}
	var top_speed := max_speed
	var surface := _surface_factors()
	var top_speed := max_speed * surface.x

	# ...

	# 3. Engine, brakes and drag only change the forward part.
	if throttle > 0.0:
		forward_speed = move_toward(forward_speed, top_speed * throttle, acceleration * delta)
	elif throttle < 0.0 and forward_speed > 0.0:
		forward_speed = move_toward(forward_speed, 0.0, braking * delta)
	elif throttle < 0.0:
		forward_speed = move_toward(forward_speed, -max_reverse_speed * surface.x, acceleration * delta)
	else:
		forward_speed = move_toward(forward_speed, 0.0, drag * delta)
	# Going faster than this surface allows (just ran off the road)? Scrub speed off.
	if absf(forward_speed) > top_speed:
		forward_speed = move_toward(forward_speed, signf(forward_speed) * top_speed, braking * 0.5 * delta)

	# 4. Grip kills the sideways part. Whatever survives is the drift.
	side_speed *= exp(-grip * surface.y * delta)
```

The "scrub" block handles the moment you leave the road at full speed. Without it, letting go of the throttle off-road would only apply the gentle `drag`, and you'd coast across the table at road speed. With it, the car loses speed at half braking strength until it's down to the off-road limit. It feels like hitting thick grass.

:::note[Why `if track`?]
The car doesn't *need* a track. Without one (like in the empty test scene from the last chapter), `_surface_factors()` just returns `Vector2.ONE` and the car drives on perfect tarmac everywhere. Small things like this make scenes easy to test on their own.
:::

## Put the car on the track

Open `race.tscn`. Instance `tracks/breakfast.tscn` as the first child of `Race`, so it's drawn underneath, and move the car to just behind the start line at (520, 600).

For now, give the car a camera of its own: right-click the car instance, **Add Child Node**, pick `Camera2D`, and turn on **Position Smoothing** (speed `5`). A proper race camera arrives in chapter 7. The car also needs to know about the track, so give `Race` a tiny script:

```gdscript title="race.gd"
extends Node2D


func _ready() -> void:
	$Car.track = $BreakfastTable
```

Run it and drive a lap. Cut a corner across the table and feel the car bog down; the kerbs are fine.

```quiz
question: The road is 60 px wide with 6 px kerbs. A car's centre is 34 px from the curve. Is it off-road?
options:
  - "Yes: 34 is more than 30, half the road width"
  - "No: 34 is less than 36, half the road plus a kerb"
answer: 1
explain: '`is_off_road` compares against `road_width / 2 + kerb_width`, which is 30 + 6 = 36. At 34 px the car is on the kerb, and the kerb counts as road.'
```

```quiz
question: Why return both multipliers from one `_surface_factors()` function instead of checking `off_road` in several places?
options:
  - It's faster
  - All ground types answer the same question in one place; later we add spills and cloths without touching the handling code
  - Godot requires it
answer: 1
```
