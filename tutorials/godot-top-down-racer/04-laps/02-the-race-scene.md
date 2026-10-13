---
title: The race scene
description: Spawning cars on a starting grid from code, and counting laps.
estimatedMinutes: 25
---

Until now the car was placed by hand. A real race needs a variable number of cars (one or two players now, CPU drivers in the next chapter), so the race scene will create them from code.

## Race bookkeeping on the car

Each car needs to remember its own race: which lap it's on, which checkpoint it needs next, and its times. Add these to `car.gd`:

```gdscript title="car.gd" ins={1}
@export var driver_name := "P1"
@export var color := Color("e23b3b")
```

```gdscript title="car.gd"
# Race bookkeeping, managed by race.gd.
var lap := 1
var next_checkpoint := 1
var lap_start_time := 0.0
var best_lap := INF
var finished := false
var finish_time := 0.0
```

Cars start **behind** the line on lap 1, waiting for checkpoint **1**. Driving over the line at the start then does nothing, because checkpoint 0 isn't the one they need. The race clock starts at "GO", so lap 1 is timed from the grid and every later lap from line to line. The grid is only a few car lengths behind the line, so the difference is tiny, and it's far simpler than a separate formation lap.

`INF` (infinity) for `best_lap` means "no lap yet". Any real lap time is smaller, so `minf(best_lap, lap_time)` just works.

## A starting grid

The track knows where its start line is, so it can hand out grid slots: a staggered, two-wide grid behind the line, like a real race. Add to `track.gd`:

```gdscript title="track.gd"
## Where car number `slot` starts: a staggered two-wide grid behind the line.
func grid_transform(slot: int) -> Transform2D:
	var start := transform_at(-36.0 - slot * 22.0)
	var side := -1.0 if slot % 2 == 0 else 1.0
	start.origin += start.y * side * road_width * 0.22
	return start
```

Slot 0 is 36 px behind the line, and each slot after it is 22 px further back. `start.y` points to the road's right-hand side, so even slots go left of centre and odd ones right. Because `transform_at` returns a full `Transform2D`, assigning it to a car places **and** rotates it to face along the road.

## Formatting times

Lap times need printing as `0:14.68`. Create `format.gd`, a script with only static functions:

```gdscript title="format.gd"
class_name Format
## Helpers that turn race numbers into text.


## 83.456 seconds becomes "1:23.46".
static func time(seconds: float) -> String:
	if is_inf(seconds):
		return "-:--.--"
	var minutes := floori(seconds / 60.0)
	return "%d:%05.2f" % [minutes, seconds - minutes * 60.0]


## 1 becomes "1st", 2 becomes "2nd", and so on.
static func ordinal(place: int) -> String:
	match place:
		1:
			return "1st"
		2:
			return "2nd"
		3:
			return "3rd"
	return "%dth" % place
```

`static func` belongs to the class, not to an object: call it as `Format.time(83.4)` from anywhere, no instance needed. A script without `extends` is a `RefCounted`, but we never make one. `%05.2f` means "at least 5 characters, 2 decimals, padded with zeros", so 4.5 seconds prints as `04.50`.

## The race script

Open `race.tscn`. Delete the hand-placed car (and its camera), then set up:

```text
Race (Node2D)                 # race.gd
├── BreakfastTable            # the track instance from before
├── Cars (Node2D)             # spawned cars go here
└── Camera2D                  # Position Smoothing on (speed 5), Process Callback: Physics
```

Replace `race.gd` with:

```gdscript title="race.gd"
extends Node2D
## Runs one race on the track in this scene.

const CAR_SCENE := preload("res://car.tscn")
const PLAYER_COLORS: Array[Color] = [Color("e23b3b"), Color("3b7be2")]
const LAPS := 3

## How many players race. Each gets a car and the matching input actions.
@export_range(1, 2) var player_count := 1

var cars: Array[Car] = []
var players: Array[Car] = []
var race_time := 0.0

@onready var track: Track = $BreakfastTable
@onready var cars_node: Node2D = $Cars
@onready var camera: Camera2D = $Camera2D


func _ready() -> void:
	track.checkpoint_entered.connect(_on_checkpoint_entered)
	_spawn_cars()


func _spawn_cars() -> void:
	for player in player_count:
		var car: Car = CAR_SCENE.instantiate()
		car.driver_name = "P%d" % (player + 1)
		car.color = PLAYER_COLORS[player]
		car.input_prefix = "p%d" % (player + 1)
		players.append(car)
		car.track = track
		car.transform = track.grid_transform(player)
		cars_node.add_child(car)
		cars.append(car)


func _physics_process(delta: float) -> void:
	race_time += delta
	camera.global_position = players[0].global_position


func _on_checkpoint_entered(car: Car, index: int) -> void:
	if index != car.next_checkpoint:
		return # Skipped part of the track (or going backwards): doesn't count.
	car.next_checkpoint = (index + 1) % track.checkpoint_count
	if index == 0:
		_complete_lap(car)


func _complete_lap(car: Car) -> void:
	var lap_time := race_time - car.lap_start_time
	car.lap_start_time = race_time
	car.best_lap = minf(car.best_lap, lap_time)
	car.lap += 1
	print("%s lap %d: %s" % [car.driver_name, car.lap - 1, Format.time(lap_time)])
```

- `preload` loads `car.tscn` once, when the script loads. `instantiate()` then stamps out a fresh copy of the scene for every car.
- The properties are set **before** `add_child()`. That matters: adding a node to the tree runs its `_ready()`, which colours the body from `color`. Set it afterwards and every car would start red.
- `(index + 1) % track.checkpoint_count` wraps from the last checkpoint (7) back to 0, the finish line. Only reaching 0 that way completes a lap.
- The camera simply jumps to player one every tick; the camera's own **Position Smoothing** turns that into a smooth follow. Chapter 7 replaces it with a proper race camera.

Set **Player Count** on `Race` to 2 to race a friend: P2 spawns in slot 1 with the arrow keys. (The camera only follows P1 for now.)

Run it and drive a lap. The Output panel prints each lap time. Try cutting across the infield: no lap.

```quiz
question: A car is waiting for checkpoint 7 of 8 and drives through it. What is `next_checkpoint` now?
type: text
answer: ["0"]
explain: (7 + 1) % 8 = 0. The car now needs the finish line, which completes the lap.
```

```quiz
question: Why set `car.color` before calling `add_child(car)`?
options:
  - Properties can't be changed after a node is in the tree
  - add_child runs the car's _ready(), which uses color to paint the body
  - It's faster
answer: 1
```
