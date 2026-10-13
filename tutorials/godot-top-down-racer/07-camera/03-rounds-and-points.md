---
title: Rounds and points
description: Ending a round, lining the cars up again, and winning the match.
estimatedMinutes: 20
---

## Ending a round

When a car falls off the screen, the round is over: the winner takes a point, the cars stop, and after a short pause both are lined up again where the leader was. A new state keeps the rest of the race code from interfering while that happens:

```gdscript title="race.gd" ins={2} del={1}
enum State { COUNTDOWN, RACING, FINISHED }
enum State { COUNTDOWN, RACING, ROUND_OVER, FINISHED }
```

Add a `RoundTimer` to `race.tscn` (**Wait Time** `2`, **One Shot** on) and connect its `timeout` to `Race`:

```gdscript title="race.gd"
@onready var round_timer: Timer = $RoundTimer


func _end_round(winner: Car) -> void:
	state = State.ROUND_OVER
	var w := cars.find(winner)
	points[w] += 1
	points[1 - w] -= 1
	hud.update_points(cars, points)
	for car in cars:
		car.controls_enabled = false
	if points[w] == START_POINTS * 2:
		state = State.FINISHED
		hud.show_message("%s wins!" % winner.driver_name, 2.0)
		end_timer.start()
	else:
		hud.show_message("%s takes the point" % winner.driver_name, 2.0)
		round_timer.start()


## Line both cars up again where the leader was, and count down.
func _on_round_timer_timeout() -> void:
	var leader := standings[0]
	var offset := track.offset_at(leader.global_position)
	for i in cars.size():
		var start := track.transform_at(offset)
		var side := -1.0 if i == 0 else 1.0
		start.origin += start.y * side * track.road_width * 0.22
		cars[i].place(start)
		cars[i].lap = leader.lap
		cars[i].next_checkpoint = leader.next_checkpoint
	camera.snap()
	_start_countdown()
```

- There are only two cars, so if the winner is at index `w`, the loser is at `1 - w`.
- The cars are placed at the leader's spot **on the centre line**, side by side, facing along the road. Even if the leader had drifted onto the table, the restart is fair.
- Copying `lap` and `next_checkpoint` from the leader matters: progress (and so "who's leading") depends on them. If the trailing car kept its old values, it might count as a lap behind, or ahead, after the restart.
- `_start_countdown()` is reused as is: "3, 2, 1, GO!" before every round.

Checkpoints shouldn't count during the pause either:

```gdscript title="race.gd" ins={3} del={2}
func _on_checkpoint_entered(car: Car, index: int) -> void:
	if state == State.COUNTDOWN or car.finished:
	if state == State.COUNTDOWN or state == State.ROUND_OVER or car.finished:
		return
	# ...
```

## Putting a car back

`place()` is a new car method that teleports it and resets its motion:

```gdscript title="car.gd"
## Put the car somewhere new, standing still. Used to line cars up between rounds.
func place(new_transform: Transform2D) -> void:
	transform = new_transform
	velocity = Vector2.ZERO
	forward_speed = 0.0
```

It grows a few more lines in the next chapters, once cars can be in the air and leave skid marks. Setting `transform` directly on a physics body is fine here because the car is standing still with its controls off; the physics engine picks up the new position on the next tick.

## Winning the match

When a car holds all 8 points, the end timer fires as usual. Add a third kind of result to `results.gd`:

```gdscript title="results.gd"
func show_match_winner(winner: Car) -> void:
	title.text = "%s wins the match!" % winner.driver_name
	_start_table([])
	again_button.text = "Rematch"
	_open(again_button)
```

`_start_table([])` with no headers hides the table: a match result is just a name. And in `race.gd`:

```gdscript title="race.gd" ins={2-4}
func _on_end_timer_timeout() -> void:
	if head_to_head:
		results.show_match_winner(standings[0])
		return
	results.show_race(standings)
```

Switch `Session.mode` to `Mode.HEAD_TO_HEAD` and `players` to 2, and have a duel. It's surprisingly tense: a bad corner and you're off the edge. With one player, the CPU car is a strong but beatable opponent. Try braking later than it does.

```quiz
question: P2 (index 1) wins a round when points are [5, 3]. What are the points now?
type: text
answer: ["[4, 4]", "4, 4", "4 4", "[4,4]", "4,4"]
explain: The winner gains one and the loser drops one, so [5, 3] becomes [4, 4]. The match is level again.
```

```quiz
question: Why copy `lap` and `next_checkpoint` from the leader when lining the cars up?
options:
  - So the trailing car gets a free lap
  - Progress depends on them; without copying, the two cars side by side could rank a lap apart
  - Godot resets them otherwise
answer: 1
```
