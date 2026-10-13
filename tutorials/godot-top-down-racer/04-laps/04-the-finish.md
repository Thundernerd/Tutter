---
title: The finish
description: Finishing order, a finish message, and restarting the race.
estimatedMinutes: 15
---

## Finishing

When a car completes its last lap it's **finished**: it gets a finish time and a place in the finishing order, which is the race result. Once every player has finished, the race is over.

Add an `EndTimer` to `race.tscn` (**Wait Time** `2`, **One Shot** on) and connect its `timeout` to `Race`. Then:

```gdscript title="race.gd" ins={1,4,9,17-18,21-30,33-34}
var finish_order: Array[Car] = []

# ...
@onready var end_timer: Timer = $EndTimer

# ...

func _on_checkpoint_entered(car: Car, index: int) -> void:
	if state == State.COUNTDOWN or car.finished:
		return
	# ...


func _complete_lap(car: Car) -> void:
	# ...
	car.lap += 1
	if car.lap > LAPS:
		_finish(car)


func _finish(car: Car) -> void:
	car.finished = true
	car.finish_time = race_time
	finish_order.append(car)
	if not car.is_player():
		return
	hud.show_message("%s finished %s!" % [car.driver_name, Format.ordinal(finish_order.size())], 2.0)
	if players.all(func(p: Car) -> bool: return p.finished):
		state = State.FINISHED
		end_timer.start()


func _on_end_timer_timeout() -> void:
	get_tree().reload_current_scene()
```

and a small helper on the car:

```gdscript title="car.gd"
func is_player() -> bool:
	return input_prefix != ""
```

- `lap` counts the lap you're **on**. After the third lap it becomes 4, and 4 > `LAPS` means you're done. The HUD shows "Finished" from then on, instead of "Lap 4/3".
- A finished car ignores checkpoints: its result is fixed.
- `players.all(...)` takes a **lambda**, a small unnamed function, and returns true if it returns true for every element. Here: "has every player finished?"
- The `is_player()` check doesn't do anything yet (every car is a player), but the CPU cars in the next chapter will finish too, and they don't get a message.
- For now the race just restarts two seconds after the finish. `reload_current_scene()` throws the whole scene away and loads it fresh: cars, laps and timers reset for free. In chapter 6 a results screen takes its place.

:::note[About that print]
You can delete the `print` from `_complete_lap` now that the HUD shows the best lap. Printing is still a great way to check that something happens at all, before building UI for it.
:::

## Race against the clock

That's a complete time-trial game: three laps, a countdown, lap times and a finish. Set **Player Count** to 2 and it's a two-player race. Turn on **Debug → Visible Collision Shapes** to watch the checkpoints, and try to cheat them: drive backwards over the line, or cut through the infield. Neither counts.

The race is lonely, though. Time for some opponents.

```quiz
question: "`LAPS` is 3. A car crosses the line after its third lap. What happens?"
options:
  - Its lap becomes 4, which is more than LAPS, so it finishes
  - Its lap becomes 3 and it finishes
  - Nothing until it crosses the line again
answer: 0
```

```quiz
question: Why do finished cars ignore checkpoints?
options:
  - So a car that keeps driving can't complete more laps and change its result
  - Area2D stops detecting finished cars
  - To save CPU time
answer: 0
```
