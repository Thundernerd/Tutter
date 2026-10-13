---
title: Checkpoints
description: Invisible Area2D gates along the curve, created from code.
estimatedMinutes: 20
---

## Why not just a finish line?

The obvious lap counter is "crossing the finish line adds a lap". Then drive over the line, turn round, drive back over it, and repeat: ten laps in ten seconds. Or cut across the infield to skip half the track.

**Checkpoints** fix both. They're invisible gates spread along the track, numbered in racing order, with the finish line as checkpoint 0. Each car remembers which one it needs **next**, and only that one counts. Hitting any other checkpoint (because you skipped a section or you're driving backwards) does nothing. A lap only counts when you reach checkpoint 0 having passed all the others, in order.

```text
         ┌──── 2 ────┐
         │           │
         1           3
         │           │
    ═════0═══ ← start/finish
```

## Gates along the curve

Checkpoints are `Area2D`s: they detect cars driving through without blocking them. We don't place them by hand: the track creates them at runtime, evenly spaced along the curve. Change the curve and the checkpoints follow.

Add to `track.gd`:

```gdscript title="track.gd" ins={1,3}
signal checkpoint_entered(car: Car, index: int)

@export var checkpoint_count := 8
```

```gdscript title="track.gd" ins={7,11-33}
func _ready() -> void:
	# ...
	if Engine.is_editor_hint():
		# Redraw while the curve is edited, so the editor shows the real road.
		curve.changed.connect(_build_road)
		return
	_build_checkpoints()
	_build_table_edges()


func _build_checkpoints() -> void:
	for i in checkpoint_count:
		var shape := RectangleShape2D.new()
		# Thin along the road, and wider than the road so cutting a corner still counts.
		shape.size = Vector2(16, road_width + kerb_width * 2.0 + 40.0)
		var collision := CollisionShape2D.new()
		collision.shape = shape
		var area := Area2D.new()
		area.name = "Checkpoint%d" % i
		area.collision_layer = 0
		area.collision_mask = 0
		area.set_collision_layer_value(3, true) # checkpoints
		area.set_collision_mask_value(2, true) # cars
		area.monitorable = false
		area.transform = transform_at(length * i / checkpoint_count)
		area.add_child(collision)
		area.body_entered.connect(_on_checkpoint_body_entered.bind(i))
		add_child(area)


func _on_checkpoint_body_entered(body: Node2D, index: int) -> void:
	if body is Car:
		checkpoint_entered.emit(body, index)
```

### Reading it

- `transform_at(length * i / checkpoint_count)` gives each gate a position on the curve **and** the curve's rotation there. The rectangle is 16 px long in the racing direction (x) and wider than the road across it (y), so it sits across the road like a real timing line.
- `set_collision_layer_value(3, true)` uses the layer **number** from the layer names table, which reads better than the bit value `4`. Clearing both first matters, because new areas start on layer 1 with mask 1.
- `monitorable = false`: nothing needs to detect the checkpoints; they only detect cars. That saves the physics engine some work.
- `.bind(i)` adds the checkpoint's index as an extra argument. All eight areas share one handler, which still knows which gate fired.
- The track doesn't count laps itself. It re-emits a single `checkpoint_entered(car, index)` signal, and whoever runs the race decides what that means. This keeps the track reusable: the main menu's background race (chapter 10) uses the same track without caring about laps at all.

:::tip[Seeing them]
Turn on **Debug → Visible Collision Shapes** and run the game: the eight gates appear as blue-ish rectangles across the road.
:::

```quiz
question: A car's next checkpoint is 3, and it drives through checkpoint 5. What happens?
options:
  - Its next checkpoint becomes 6
  - Nothing; only checkpoint 3 counts
  - It loses a lap
answer: 1
explain: Only the expected checkpoint counts, so the car must still go back and pass checkpoint 3. Skipping part of the track gains nothing.
hint: Only one checkpoint ever counts for a car.
```

```quiz
question: Why does the track emit `checkpoint_entered` instead of counting laps itself?
options:
  - Area2D signals can't be connected to scripts on the same node
  - So the track stays reusable; the race scene decides what checkpoints mean
  - Signals are faster than function calls
answer: 1
```
