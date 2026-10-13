---
title: Engine and brakes
description: Forward speed, move_toward, and a car that only goes in straight lines.
estimatedMinutes: 20
---

## The plan

Every physics tick, the car will:

1. Read the controls into two numbers: `throttle` (-1 to 1) and `steer` (-1 to 1).
2. Work out a new `velocity` from them (the "handling").
3. Call `move_and_slide()` to actually move.

Keeping step 1 separate pays off in chapter 5: a CPU driver just sets `throttle` and `steer` itself, and the rest of the car can't tell the difference.

## Forward speed

A top-down car can face one way and move another (that's a drift). So instead of storing a single speed, we ask: *how much of the velocity points where the nose points?* That's a **dot product**:

```text
forward_speed = velocity.dot(transform.x)
```

`transform.x` is a vector of length 1 pointing out of the nose. The dot product with it measures how fast we're going *in that direction*: positive when moving forwards, negative when reversing, and zero when sliding exactly sideways.

## The script

Attach a script to `Car`:

```gdscript title="car.gd"
class_name Car
extends CharacterBody2D
## A top-down arcade car. Players drive it with input actions; CPU cars get an AIDriver.

@export var color := Color("e23b3b")
## Prefix of the input actions that drive this car: "p1" reads p1_accelerate and friends.
## Leave empty for CPU cars.
@export var input_prefix := "p1"

@export_group("Engine")
@export var max_speed := 260.0
@export var acceleration := 280.0
@export var braking := 600.0
@export var max_reverse_speed := 100.0
## How quickly the car slows down when you let go of the throttle.
@export var drag := 90.0

## -1 (full brake or reverse) to 1 (full throttle). Set by input or the AI.
var throttle := 0.0
## -1 (left) to 1 (right).
var steer := 0.0

## Speed along the car's nose in px/s. Negative when reversing.
var forward_speed := 0.0


func _ready() -> void:
	$Visuals/Body.color = color


func _physics_process(delta: float) -> void:
	_read_input()
	_drive(delta)
	move_and_slide()


func _read_input() -> void:
	throttle = Input.get_axis(input_prefix + "_brake", input_prefix + "_accelerate")
	steer = Input.get_axis(input_prefix + "_left", input_prefix + "_right")


func _drive(delta: float) -> void:
	var top_speed := max_speed
	var forward := transform.x
	forward_speed = velocity.dot(forward)

	# Engine, brakes and drag only change the forward part.
	if throttle > 0.0:
		forward_speed = move_toward(forward_speed, top_speed * throttle, acceleration * delta)
	elif throttle < 0.0 and forward_speed > 0.0:
		forward_speed = move_toward(forward_speed, 0.0, braking * delta)
	elif throttle < 0.0:
		forward_speed = move_toward(forward_speed, -max_reverse_speed, acceleration * delta)
	else:
		forward_speed = move_toward(forward_speed, 0.0, drag * delta)

	velocity = forward * forward_speed
```

### What's going on

- **`class_name Car`** registers a global type. Other scripts can write `var car: Car` and get autocompletion for its properties. We'll lean on that a lot.
- **`@export_group("Engine")`** groups the following exports under a foldable heading in the Inspector. The `##` comments above exports become their Inspector tooltips.
- **`move_toward(from, to, step)`** moves a value towards a target by at most `step`, without overshooting. With `acceleration = 280` and `delta = 1/60`, the speed rises by 4.7 px/s per tick until it reaches the target. It's the workhorse of arcade movement: no formulas, just "get there at this rate".
- The **brake** branch only runs while still moving forwards. Once `forward_speed` reaches 0, the next branch takes over and the same key accelerates you backwards, up to `max_reverse_speed`.
- `top_speed * throttle` makes a half-pressed gamepad trigger give half the top speed. On a keyboard `throttle` is always -1, 0 or 1.

:::note[Why `delta` here but not for `move_and_slide()`?]
`velocity` is in pixels per **second**, and `move_and_slide()` multiplies by the frame time itself. But `move_toward`'s step is "this tick's change", so the rates (px/s per second) have to be multiplied by `delta`.
:::

## Try it

Open `race.tscn`, drag `car.tscn` onto `Race`, and place it at (320, 180). Press <kbd>F5</kbd>: <kbd>W</kbd> accelerates to the right, letting go coasts to a stop, and <kbd>S</kbd> brakes and then reverses. It can't turn yet, so it will happily drive off the screen. A track and camera are coming in the next chapter.

```quiz
question: The car is rolling forwards at 100 px/s and you hold brake (`throttle = -1`). What happens over the next second, with `braking = 600` and `acceleration = 280`?
options:
  - It slows to 0 in about 0.17 s, then reverses
  - It slows to 0 in about 0.36 s, then reverses
  - It stops and stays stopped
answer: 0
explain: 'Braking removes 600 px/s per second, so 100 px/s takes 1/6 s. Then `forward_speed` is no longer above 0, the reverse branch takes over, and the car accelerates backwards at 280 px/s².'
```

```quiz
type: text
question: Which global function moves a number towards a target by a fixed step without overshooting?
answer: [move_toward, move_toward()]
```
