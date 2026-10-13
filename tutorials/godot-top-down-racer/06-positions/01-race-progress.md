---
title: Race progress
description: One number per car that says how far it has raced, and sorting by it.
estimatedMinutes: 20
---

## Who's in front?

"Who's leading?" sounds easy, but positions on screen don't help: on a twisty track the leader can be behind you in x and y. What we want is **how far along the race** each car is. The curve already measures distance along the track, so:

```text
progress = (lap - 1) × track length + offset on this lap
```

A car on lap 2, 500 px into the lap, on a 2800 px track, has driven 2800 + 500 = 3300 px. Sort the cars by progress, biggest first, and you have the standings.

## The start line problem

There's a catch, and it's at the start line, where the curve begins and ends. The grid is **behind** the line, so for a car on the grid the closest point on the curve is near the *end*: an offset of about 2760 out of 2800. On lap 1 that reads as "nearly a full lap done", and the cars at the back of the grid would be leading.

The same happens the other way: a car that's just crossed the line has an offset of almost 0, a moment before `lap` goes up.

The checkpoints tell us which case we're in:

| `next_checkpoint` | Where the car is | Offset near the end means... |
| --- | --- | --- |
| 1 | On the grid, or just started the lap | ...behind the line: subtract a lap |
| 0 | Past the last checkpoint, heading for the line | (normal) |
| 0, but offset near 0 | Over the line, lap not counted yet | ...add a lap |

"Near the end" just means "more than half a lap", which is safe as long as there are at least three checkpoints.

## The code

Add a progress field to `car.gd`'s bookkeeping:

```gdscript title="car.gd" ins={3}
var finished := false
var finish_time := 0.0
var progress := 0.0
```

Then in `race.gd`:

```gdscript title="race.gd" ins={2-3,11,18,22-47}
var players: Array[Car] = []
## Every car in race order, leader first. Updated every physics frame.
var standings: Array[Car] = []
var finish_order: Array[Car] = []

# ...

func _ready() -> void:
	track.checkpoint_entered.connect(_on_checkpoint_entered)
	_spawn_cars()
	_update_standings()
	# ...


func _physics_process(delta: float) -> void:
	if state == State.RACING or state == State.FINISHED:
		race_time += delta
	_update_standings()
	# ...


func _update_standings() -> void:
	for car in cars:
		car.progress = _progress(car)
	standings = cars.duplicate()
	standings.sort_custom(_is_ahead)


## How far a car has driven in total: completed laps plus distance into this lap.
func _progress(car: Car) -> float:
	var offset := track.offset_at(car.global_position)
	# Just behind the start line, the closest point is near the *end* of the curve.
	if car.next_checkpoint == 1 and offset > track.length / 2.0:
		offset -= track.length
	# Past the last checkpoint but over the line already, the offset restarted at 0.
	elif car.next_checkpoint == 0 and offset < track.length / 2.0:
		offset += track.length
	return (car.lap - 1) * track.length + offset


## Sort order for standings: finished cars by finishing order, then by progress.
func _is_ahead(a: Car, b: Car) -> bool:
	if a.finished and b.finished:
		return finish_order.find(a) < finish_order.find(b)
	if a.finished != b.finished:
		return a.finished
	return a.progress > b.progress
```

- `sort_custom` sorts using your own comparison function. It's called with pairs of cars and must return `true` when `a` belongs **before** `b`.
- Finished cars always rank above unfinished ones, in the order they finished. Their progress stops mattering once they've crossed the line: a winner cruising round on autopilot mustn't be overtaken by its own victory lap.
- We sort a **copy** (`duplicate()`) so `cars` keeps the grid order, which other code (and the head-to-head points later) relies on.

Sorting four cars sixty times a second costs nothing. Even with twenty cars it would be negligible.

```quiz
question: A car on the grid has `next_checkpoint = 1` and its closest offset is 2760 on a 2800 px track. What is its progress?
options:
  - "2760"
  - "-40"
  - "0"
answer: 1
explain: With `next_checkpoint == 1`, an offset past half a lap means "behind the line", so 2800 is subtracted. (1 - 1) × 2800 + (2760 - 2800) = -40.
```

```quiz
question: Car A has finished; car B hasn't, but its progress is higher because A is now cruising slowly. Who ranks first?
options:
  - A, because finished cars always rank above unfinished ones
  - B, because its progress is higher
answer: 0
```
