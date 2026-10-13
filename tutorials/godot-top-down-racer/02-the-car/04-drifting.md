---
title: Drifting
description: Separate forward and sideways velocity, and give the tyres a grip value.
estimatedMinutes: 20
---

## Two kinds of speed

Picture the car from above, moving and turning at the same time. Its velocity splits into two parts:

```text
              forward (transform.x)
                 ▲
                 │  forward_speed = velocity · forward
     ┌───────────┼──┐
     │    car    ●──┼──▶ right (transform.y)
     └──────────────┘   side_speed = velocity · right
```

- **Forward speed** is what the engine and brakes control.
- **Side speed** is the car sliding sideways. Real tyres resist it: that's *grip*. Lots of grip and the slide dies almost instantly. A little grip and the car keeps sliding through the corner. That's a drift.

The arcade trick is to treat them separately: engine and brakes change only the forward part, grip shrinks only the side part, and then we put them back together.

## Grip as decay

How should grip shrink the side speed? A good arcade model is **exponential decay**: every second, keep only a fraction of the side speed.

```text
side_speed *= exp(-grip * delta)
```

With `grip = 9`, about `e^(-9 / 60) ≈ 0.86` of the side speed survives each tick at 60 fps. After a tenth of a second, a quarter of it is left; after a third of a second, almost nothing.

:::note[Why `exp` and not just `* 0.86`?]
A fixed `* 0.86` per tick makes grip depend on the frame rate: at 120 ticks per second the slide would die twice as fast. `exp(-grip * delta)` gives the same decay per *second* at any tick rate. The same idea shows up again for the camera's smooth follow.
:::

## The code

Add the two grip settings and a `drifting` flag, then split the velocity in `_drive()`:

```gdscript title="car.gd" ins={6-9,15,26,28,30,32,42-44,46}
@export_group("Handling")
## Turning speed at full lock, in radians per second.
@export var turn_speed := 3.4
## Below this speed steering is weaker: a parked car can't spin on the spot.
@export var full_steer_speed := 90.0
## How quickly sideways sliding dies away. Lower values mean longer drifts.
@export var grip := 9.0
## Sideways speed (px/s) above which the car counts as drifting.
@export var drift_threshold := 45.0

# ...

## Speed along the car's nose in px/s. Negative when reversing.
var forward_speed := 0.0
var drifting := false

# ...

func _drive(delta: float) -> void:
	var top_speed := max_speed

	# 1. Steering rotates the car. It's weak at low speed and flips when reversing.
	var steer_strength := clampf(absf(forward_speed) / full_steer_speed, 0.0, 1.0)
	rotation += steer * turn_speed * steer_strength * signf(forward_speed) * delta

	# 2. Split the velocity along the car's (new) forward and sideways directions.
	var forward := transform.x
	var right := transform.y
	forward_speed = velocity.dot(forward)
	var side_speed := velocity.dot(right)

	# 3. Engine, brakes and drag only change the forward part.
	if throttle > 0.0:
		forward_speed = move_toward(forward_speed, top_speed * throttle, acceleration * delta)
	elif throttle < 0.0 and forward_speed > 0.0:
		forward_speed = move_toward(forward_speed, 0.0, braking * delta)
	elif throttle < 0.0:
		forward_speed = move_toward(forward_speed, -max_reverse_speed, acceleration * delta)
	else:
		forward_speed = move_toward(forward_speed, 0.0, drag * delta)

	# 4. Grip kills the sideways part. Whatever survives is the drift.
	side_speed *= exp(-grip * delta)
	drifting = absf(side_speed) > drift_threshold

	velocity = forward * forward_speed + right * side_speed
```

The order matters. We rotate **first**, then measure. When you steer, the car turns but the velocity doesn't: it still points where the car *was* heading. Measured against the new axes, part of it now shows up as side speed. Grip then eats it over the next few ticks, so the velocity swings round to follow the nose, a little late. That lag is the drift you feel.

The drift also costs speed for free: the part of the velocity that grip removes is simply gone. Throw the car into a hairpin flat out and it slides wide and comes out slower, without any special "cornering" code.

`drifting` doesn't change the handling. It's for effects: skid marks and tyre smoke in the polish chapter.

## Tuning

Run the game and throw the car around. Then experiment in the Inspector (the **Handling** group) while the game runs. Changes made to the running game's nodes in the **Remote** tree apply instantly:

| Change | Feels like |
| --- | --- |
| `grip` 20 | Go-kart: almost no slide |
| `grip` 4 | Ice rink: long, lazy drifts |
| `turn_speed` 5 | Twitchy, hard to keep straight |
| `full_steer_speed` 30 | Turns sharply even at walking pace |

The defaults (grip 9, turn speed 3.4) give short, controllable slides that reward easing off in the tight corners.

:::tip[A playable car]
That's the whole handling model: about twenty lines. Everything later (off-road, spills, ramps) just changes the numbers that go into it.
:::

```quiz
question: The car drives straight right at 200 px/s, then rotates 90° in a single tick. Right after the split, what are `forward_speed` and `side_speed`?
options:
  - forward 200, side 0
  - forward 0, side ±200
  - forward 100, side 100
answer: 1
explain: The velocity still points right, but the car now faces up or down. None of the velocity lies along the new forward axis, so it all shows up as sideways speed, which grip then wears down.
```

```quiz
question: Which values make the car drift more? Select all that apply.
type: multiple
options:
  - A lower grip
  - A higher grip
  - A higher turn_speed
  - A lower drift_threshold
answer: [0, 2]
explain: Lower grip lets side speed survive longer, and faster turning creates more side speed per tick. `drift_threshold` only decides when we *call* it a drift (for effects); it doesn't change the handling.
```
