---
title: Randomness and avoidance
description: A wandering racing line, slightly different drivers, and steering around the car in front.
estimatedMinutes: 20
---

## A bit of randomness

Identical drivers make a boring procession. Two small doses of randomness fix it:

1. **Skill varies** by ±3% per driver, so some CPU cars are a little faster than others.
2. **The racing line wanders.** Instead of aiming exactly at the centre line, each driver aims a little to one side, and that sideways offset (the "lane") drifts slowly back and forth along a sine wave. Every driver gets its own random phase and speed, so they spread out across the road.

The aim point's `y` axis points to the road's right-hand side, so shifting the target sideways is just `aim.origin + aim.y * lane`.

## Avoiding other cars

The wandering lane is also the perfect place to steer around other cars. For each car **just in front of us** (in our local coordinates: a little ahead, and not far to either side), push our lane towards the side it isn't on. The closer it is, the harder we push.

```text
               ▲ ahead (local +x)
      ┌───────────────┐
      │   ▓ other car │  local.y > 0 (to our right): nudge left
      │               │  0 < local.x < 50 and |local.y| < 20
      └───────────────┘
             🚗
```

It isn't real path planning, but at 260 px/s it looks convincing: CPU cars dodge round each other and round you, and when they can't, the car-to-car shove from the track chapter kicks in.

## The finished driver

```gdscript title="ai_driver.gd" ins={1-2,9-10,18-19,30-32,34,41-52}
## Cars closer than this, in front of us, make us steer around them.
const AVOID_DISTANCE := 50.0

var car: Car
var track: Track
## Fraction of the car's top speed this driver aims for.
var skill := 0.9

var _wander_phase := randf() * TAU
var _wander_speed := randf_range(0.3, 0.7)
var _stuck_time := 0.0
var _reverse_time := 0.0


func _init(driven_car: Car, race_track: Track, driver_skill: float) -> void:
	car = driven_car
	track = race_track
	# A little randomness, so CPU cars don't drive as one perfect train.
	skill = driver_skill * randf_range(0.97, 1.03)


func update(delta: float) -> void:
	if _reverse_time > 0.0:
		_reverse(delta)
		return

	var speed := car.velocity.length()
	var offset := track.offset_at(car.global_position)

	# Steer towards a point ahead on the road, shifted sideways a little.
	_wander_phase += _wander_speed * delta
	var lane := sin(_wander_phase) * track.road_width * 0.2 + _avoidance()
	var aim := track.transform_at(offset + LOOK_AHEAD + speed * LOOK_AHEAD_PER_SPEED)
	var target := aim.origin + aim.y * lane
	var angle := car.to_local(target).angle()
	car.steer = clampf(angle * STEER_GAIN, -1.0, 1.0)

	# ...


## Sideways nudge (px) away from cars just in front of us.
func _avoidance() -> float:
	var nudge := 0.0
	for other in car.get_tree().get_nodes_in_group(&"cars"):
		if other == car:
			continue
		var local := car.to_local(other.global_position) # x: ahead of us, y: to our right
		if local.x > 0.0 and local.x < AVOID_DISTANCE and absf(local.y) < 20.0:
			# The closer the car, the harder we move to the side it isn't on.
			var away := -1.0 if local.y >= 0.0 else 1.0
			nudge += away * (1.0 - local.x / AVOID_DISTANCE) * track.road_width * 0.4
	return nudge
```

- Member variables can have initial values that call functions. `randf() * TAU` runs once per `AIDriver`, so every driver gets a different phase.
- The lane wanders by up to 20% of the road width either side of the centre: 12 px on a 60 px road. Enough to look human, not enough to clip the kerbs.
- `get_nodes_in_group(&"cars")` is why we added the car scene to the `cars` group. It returns every car in the scene tree, whatever the race scene looks like.

## Race!

That's a real race. Try a few laps against the CPU and fiddle with `CPU_SKILL` in `race.gd`: 0.82 is relaxed, 0.97 is a proper fight. (In the options chapter this becomes an easy/normal/hard setting.)

```quiz
question: Another car is at local position (30, -5) relative to us. Which way do we nudge, and how strongly (as a fraction of the maximum)?
options:
  - Right, at 0.4 of the maximum
  - Left, at 0.6 of the maximum
  - Right, at 0.6 of the maximum
answer: 0
explain: Negative local y means it's on our left, so we nudge right (`away` = +1). The strength is 1 - 30/50 = 0.4.
```

```quiz
type: multiple
question: Which of these make CPU cars differ from each other? Select all that apply.
options:
  - The random ±3% skill
  - The random wander phase and speed
  - Their grid position
  - A different AIDriver script per car
answer: [0, 1, 2]
explain: Every CPU car uses the same script; the random values and where they start are what make each race different.
```
