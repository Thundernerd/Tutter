---
title: Braking for corners
description: Measuring how sharp the road ahead bends, a target speed, and getting unstuck.
estimatedMinutes: 20
---

## How sharp is the next corner?

A human looks ahead, sees a hairpin and brakes. The AI can do the same with two directions: the road's direction **here**, and its direction a bit **further ahead**. The angle between them tells us how much the road bends in that stretch:

```text
   here ──────▶            ahead
                  ╲          ▲
                   ╲         │      angle between ▶ and ▲ = 90°: a sharp bend
                    ╰────────╯
```

`transform_at(offset).x` is the road's direction at any offset, and `Vector2.angle_to()` gives the signed angle between two vectors. We only care how *sharp* it is, not which way, so we take the absolute value.

From the bend we pick a **target speed**: full speed on straights, slowing towards `CORNER_SPEED` (45% of top speed) for the sharpest bends. Then the throttle logic is simple: too fast → brake, too slow → accelerate, about right → coast.

Like the steering target, the "ahead" point moves further away at higher speed, because a fast car needs more distance to brake.

## The code

```gdscript title="ai_driver.gd" ins={4-6,9-12,17,28-38,40} del={26}
## How far ahead (px) to aim, plus extra per px/s of speed: faster means looking further.
const LOOK_AHEAD := 40.0
const LOOK_AHEAD_PER_SPEED := 0.25
## How far ahead to check for bends, plus extra per px/s of speed.
const BRAKE_LOOK_AHEAD := 60.0
const BRAKE_LOOK_AHEAD_PER_SPEED := 0.5
## Steering per radian of angle to the target. Higher is twitchier.
const STEER_GAIN := 3.0
## Speed through the sharpest bends, as a fraction of top speed.
const CORNER_SPEED := 0.45
## A bend this sharp (radians between the two directions) gets the full slowdown.
const SHARP_BEND := 1.4

# ...


func update(delta: float) -> void:
	var speed := car.velocity.length()
	var offset := track.offset_at(car.global_position)

	# Steer towards a point ahead on the road.
	var aim := track.transform_at(offset + LOOK_AHEAD + speed * LOOK_AHEAD_PER_SPEED)
	var target := aim.origin
	var angle := car.to_local(target).angle()
	car.steer = clampf(angle * STEER_GAIN, -1.0, 1.0)
	car.throttle = 1.0

	# Slow down for bends: compare the road's direction here and further ahead.
	var here := track.transform_at(offset).x
	var ahead := track.transform_at(offset + BRAKE_LOOK_AHEAD + speed * BRAKE_LOOK_AHEAD_PER_SPEED).x
	var bend := clampf(absf(here.angle_to(ahead)) / SHARP_BEND, 0.0, 1.0)
	var target_speed := car.max_speed * skill * lerpf(1.0, CORNER_SPEED, bend)
	if car.forward_speed > target_speed + 20.0:
		car.throttle = -1.0
	elif car.forward_speed < target_speed:
		car.throttle = 1.0
	else:
		car.throttle = 0.0

	_check_stuck(delta, speed)
```

- `lerpf(1.0, CORNER_SPEED, bend)` blends between 1.0 (no bend) and 0.45 (sharpest bend). `skill` then scales the whole thing, so a 0.9 driver is 10% slower everywhere.
- The 20 px/s dead zone stops the AI flickering between full brake and full throttle every tick. Coasting in between uses the car's normal drag.
- A car that brakes hard while already sliding still slides: the handling code doesn't know who's driving. CPU cars do run wide sometimes, and that's a feature.

## Getting unstuck

Sooner or later a CPU car noses into a mug at low speed, keeps its foot down, and stays there forever. Detect it: **pressing the throttle but not moving** for most of a second means stuck. The fix is what you'd do yourself: reverse for a moment, steering so the nose swings back towards the road.

```gdscript title="ai_driver.gd"
var _stuck_time := 0.0
var _reverse_time := 0.0


func update(delta: float) -> void:
	if _reverse_time > 0.0:
		_reverse(delta)
		return
	# ...


## Pressing the throttle but not moving means we're against a wall: back off.
func _check_stuck(delta: float, speed: float) -> void:
	if car.throttle > 0.0 and speed < 15.0:
		_stuck_time += delta
	else:
		_stuck_time = 0.0
	if _stuck_time > 0.8:
		_stuck_time = 0.0
		_reverse_time = 0.8


func _reverse(delta: float) -> void:
	_reverse_time -= delta
	var offset := track.offset_at(car.global_position)
	var target := track.transform_at(offset + LOOK_AHEAD).origin
	# Reversing flips steering, so steer the "wrong" way to swing the nose round.
	car.steer = -clampf(car.to_local(target).angle() * STEER_GAIN, -1.0, 1.0)
	car.throttle = -1.0
```

Remember that the car flips steering when `forward_speed` is negative, just like a real car. To swing the **nose** towards the target while backing up, the AI steers the opposite way. Picture reversing out of a parking space.

Run it again. The CPU cars now brake for the hairpins and lap cleanly. They're also suspiciously tidy: they all follow the exact same line, nose to tail, and happily drive straight through each other's rear bumpers. Next page.

```quiz
question: The road's direction here is (1, 0) and further ahead it's (0, 1). With `SHARP_BEND = 1.4` and `CORNER_SPEED = 0.45`, what fraction of top speed does a skill 1.0 driver aim for?
options:
  - "1.0"
  - "About 0.72"
  - "0.45"
answer: 2
explain: The angle between them is 90° ≈ 1.57 rad. Divided by 1.4 that's more than 1, so `bend` clamps to 1 and the target is the full corner speed, 45%.
```

```quiz
question: Why does the AI coast (throttle 0) when it's slightly above its target speed, instead of braking?
options:
  - Braking at that point would make it flip between braking and accelerating every tick
  - Cars can't brake above their target speed
  - Coasting is faster
answer: 0
```
