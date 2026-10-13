---
title: Following the road
description: Look-ahead steering with the curve, and an AIDriver in the car's seat.
estimatedMinutes: 25
---

## Look-ahead steering

The centre line is a perfect guide: it goes everywhere the road goes. The simplest driver that works is:

1. Find where we are on the curve: `offset = track.offset_at(car.global_position)`.
2. Pick a point a little **further along** the curve: the target.
3. Steer towards the target.

```text
                       ● target (offset + look-ahead)
                    ╱
     ━━━━━━━━━━━━━╱━━━━━━━━━  centre line
        🚗 ─ ─ ─ ╯
     angle to target → steer
```

Because the target is always ahead on the curve, the car is pulled round every corner. How far ahead matters: too close and the car zig-zags around the line, too far and it cuts corners. Faster cars need to look further, because they cover the distance sooner, so the look-ahead grows with speed.

## The angle to the target

`car.to_local(target)` converts the target into the **car's** coordinate system, where +x is straight ahead and +y is to the car's right. Its `angle()` is then exactly "how far to turn": 0 when the target is dead ahead, positive when it's to the right, negative to the left. Multiply by a gain, clamp to -1..1, and that's the `steer` value.

## The driver class

Create `ai_driver.gd`:

```gdscript title="ai_driver.gd"
class_name AIDriver
extends RefCounted
## Drives a Car by steering at a point on the track's centre line a little way ahead.

## How far ahead (px) to aim, plus extra per px/s of speed: faster means looking further.
const LOOK_AHEAD := 40.0
const LOOK_AHEAD_PER_SPEED := 0.25
## Steering per radian of angle to the target. Higher is twitchier.
const STEER_GAIN := 3.0

var car: Car
var track: Track
## Fraction of the car's top speed this driver aims for.
var skill := 0.9


func _init(driven_car: Car, race_track: Track, driver_skill: float) -> void:
	car = driven_car
	track = race_track
	skill = driver_skill


func update(_delta: float) -> void:
	var speed := car.velocity.length()
	var offset := track.offset_at(car.global_position)

	# Steer towards a point ahead on the road.
	var aim := track.transform_at(offset + LOOK_AHEAD + speed * LOOK_AHEAD_PER_SPEED)
	var target := aim.origin
	var angle := car.to_local(target).angle()
	car.steer = clampf(angle * STEER_GAIN, -1.0, 1.0)
	car.throttle = 1.0
```

`AIDriver` extends `RefCounted`, not `Node`: it isn't in the scene tree and doesn't need to be. It's a plain object that frees itself once nothing references it. `_init` is its constructor, so `AIDriver.new(car, track, 0.9)` creates one. (`_delta` has an underscore because we don't use it yet; the next page does.)

## In the driver's seat

The car calls its AI instead of reading input:

```gdscript title="car.gd" ins={1-2,10-11}
## Drives the car instead of input when set.
var ai: AIDriver

# ...

func _physics_process(delta: float) -> void:
	if not controls_enabled:
		throttle = 0.0
		steer = 0.0
	elif ai:
		ai.update(delta)
	else:
		_read_input()
	# ...
```

Also add the car to a group: select `Car` in `car.tscn`, open **Node → Groups**, and add `cars`. The AI uses it on the last page of this chapter to find other cars.

## Spawning CPU cars

Now the race fills the grid up to four cars. The CPU drivers start at the front, so you have to overtake:

```gdscript title="race.gd"
const CAR_SCENE := preload("res://car.tscn")
const PLAYER_COLORS: Array[Color] = [Color("e23b3b"), Color("3b7be2")]
const CPU_NAMES: Array[String] = ["Rusty", "Zippy", "Bolt"]
const CPU_COLORS: Array[Color] = [Color("f2c230"), Color("9b59d0"), Color("f08a24")]
## Cars in a race, players included.
const RACE_CARS := 4
## Top speed of CPU cars, as a fraction of the players'.
const CPU_SKILL := 0.9
const LAPS := 3

# ...


func _spawn_cars() -> void:
	var cpu_count := RACE_CARS - player_count
	# CPU cars line up at the front of the grid, players behind them.
	for slot in cpu_count + player_count:
		var car: Car = CAR_SCENE.instantiate()
		if slot < cpu_count:
			car.driver_name = CPU_NAMES[slot]
			car.color = CPU_COLORS[slot]
			car.input_prefix = ""
			car.ai = AIDriver.new(car, track, CPU_SKILL)
		else:
			var player := slot - cpu_count
			car.driver_name = "P%d" % (player + 1)
			car.color = PLAYER_COLORS[player]
			car.input_prefix = "p%d" % (player + 1)
			players.append(car)
		car.track = track
		car.transform = track.grid_transform(slot)
		car.controls_enabled = false
		cars_node.add_child(car)
		cars.append(car)
```

Two more small changes, now that CPU cars race too:

```gdscript title="race.gd" ins={2,12-13}
func _physics_process(delta: float) -> void:
	if state == State.RACING or state == State.FINISHED:
		race_time += delta
	# ...


func _finish(car: Car) -> void:
	# ...
	if not car.is_player():
		return
	hud.show_message("%s finished %s!" % [car.driver_name, Format.ordinal(finish_order.size())], 2.0)
	# Let the car cruise on by itself after the flag.
	car.ai = AIDriver.new(car, track, 0.6)
	# ...
```

- The clock keeps running after the last player finishes, so CPU cars still out on track get real finish times.
- A player who finishes hands the wheel to an AI, which cruises at 60% speed while the others finish. It's a nice touch, and it means a finished car never just sits on the line in everybody's way.

Run it. The CPU cars drive off... at full throttle into the first corner, and most of them end up in the scenery. They never brake. That's next.

```quiz
question: In the car's local coordinates, the target is at (0, 50). Which way does the AI steer?
options:
  - Hard left
  - Straight on
  - Hard right
answer: 2
explain: Local +y is the car's right-hand side. `Vector2(0, 50).angle()` is +90°, about 1.57 rad; times the gain of 3 it clamps to +1, full right.
```

```quiz
question: Why is `AIDriver` a RefCounted instead of a Node?
options:
  - It doesn't need to be in the scene tree, so a plain object that frees itself is simpler
  - RefCounted objects run faster physics
  - Nodes can't have a constructor
answer: 0
```
