---
title: Steering
description: Turning that depends on speed, and why reversing flips it.
estimatedMinutes: 15
---

## Turning the car

Steering rotates the car. The simplest version is:

```gdscript
rotation += steer * turn_speed * delta
```

That works, but it feels wrong straight away: a parked car spins on the spot like a tank. Real cars only turn while they're rolling, and the slower they roll, the less they turn. So we scale the steering by speed:

```text
steer_strength = clamp(|forward_speed| / full_steer_speed, 0, 1)
```

Below `full_steer_speed` (90 px/s) steering is proportionally weaker; above it, you get full lock. At a standstill, it's zero.

There's one more twist. Turn the wheel left while reversing and a real car's nose swings **right**. Multiplying by `signf(forward_speed)` (+1 forwards, -1 backwards) gets that for free, and it makes three-point turns feel natural.

## The code

Add a **Handling** group of exports and two lines at the top of `_drive()`:

```gdscript title="car.gd" ins={5-9,18-20,22}
@export_group("Engine")
# ...
@export var drag := 90.0

@export_group("Handling")
## Turning speed at full lock, in radians per second.
@export var turn_speed := 3.4
## Below this speed steering is weaker: a parked car can't spin on the spot.
@export var full_steer_speed := 90.0


# ...


func _drive(delta: float) -> void:
	var top_speed := max_speed

	# 1. Steering rotates the car. It's weak at low speed and flips when reversing.
	var steer_strength := clampf(absf(forward_speed) / full_steer_speed, 0.0, 1.0)
	rotation += steer * turn_speed * steer_strength * signf(forward_speed) * delta

	# 2. Split the velocity along the car's (new) direction.
	var forward := transform.x
	forward_speed = velocity.dot(forward)
	# ...
```

`forward_speed` still holds the value from the previous tick at that point, which is exactly what we want: steer based on how fast we were going, then measure again in the new direction.

:::tip[Radians]
Godot measures rotation in **radians**: a full circle is `TAU` (about 6.28). A `turn_speed` of 3.4 means a full circle in under two seconds at full lock. If you prefer degrees, `deg_to_rad(195)` gives the same value.
:::

## On rails

Drive around. It steers nicely, but corners feel like the car is on rails: the instant the nose turns, the whole velocity turns with it. That's because the last line of `_drive()` rebuilds the velocity from the forward direction only:

```gdscript
velocity = forward * forward_speed
```

Anything that wasn't pointing forwards is thrown away every tick: that's *infinite grip*. On the next page we keep some of it, and the car starts to slide.

```quiz
question: Why multiply the steering by `signf(forward_speed)`?
options:
  - So the car can't steer while stopped
  - So steering is reversed when driving backwards, like a real car
  - To keep the rotation between -PI and PI
answer: 1
explain: The *stopping* part comes from `steer_strength`, which is 0 at standstill. The sign flips the turn direction when `forward_speed` is negative.
```
