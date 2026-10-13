---
title: Grip zones
description: Area2D patches that change the car's surface factors as it drives over them.
estimatedMinutes: 20
---

Remember `_surface_factors()`, the function that answers "what's under the car?" with a top-speed and a grip multiplier? So far the answer was either "road" or "table". Now we add more answers: a puddle of orange juice (grip × 0.25: very slippery) and a napkin (top speed × 0.6: sticky). The handling code doesn't change at all.

## The surface script

A surface is an `Area2D`: cars drive through it, and it tells them when they enter and leave. Like props, it draws itself from its collision shape, so one script covers puddles and cloths. Create `surface.gd`:

```gdscript title="surface.gd"
@tool
class_name Surface
extends Area2D
## A patch of the table that changes how cars handle: spilled juice, a napkin...
## Draws itself to match its CollisionShape2D (circle or rectangle).

@export var color := Color(1.0, 0.7, 0.2, 0.55):
	set(value):
		color = value
		queue_redraw()
## Multiplies the car's grip. Below 1 is slippery.
@export var grip := 0.25
## Multiplies the car's top speed. Below 1 is sticky.
@export var top_speed := 1.0

@onready var collision: CollisionShape2D = $CollisionShape2D


func _ready() -> void:
	if collision.shape:
		collision.shape.changed.connect(queue_redraw)
	if not Engine.is_editor_hint():
		body_entered.connect(_on_body_entered)
		body_exited.connect(_on_body_exited)


func _on_body_entered(body: Node2D) -> void:
	if body is Car:
		body.enter_surface(self)


func _on_body_exited(body: Node2D) -> void:
	if body is Car:
		body.exit_surface(self)


func _draw() -> void:
	draw_set_transform_matrix(collision.transform)
	var shape := collision.shape
	if shape is CircleShape2D:
		# A blobby puddle: one big circle and a few smaller ones around its edge.
		var r: float = shape.radius
		draw_circle(Vector2.ZERO, r, color)
		for i in 5:
			var direction := Vector2.RIGHT.rotated(i * TAU / 5.0 + 0.4)
			draw_circle(direction * r * 0.75, r * 0.4, color)
	elif shape is RectangleShape2D:
		var rect := Rect2(-shape.size / 2.0, shape.size)
		draw_rect(rect, color)
		# Stitching along the edge, so cloth looks like cloth.
		draw_rect(rect.grow(-4.0), color.lightened(0.3), false, 1.0)
```

The signals are connected from code, and only in the game. In the editor, a tool script reacting to bodies would be pointless. The surface doesn't change the car directly: it tells the car "you're on me now", and the car decides what that means. That's the same split as the checkpoints and the race.

The puddle's colour has alpha 0.55, so the road shows through: it reads as a spill, not a solid object.

## The car's side

A car can be on two surfaces at once (driving off a napkin straight into juice), so it keeps a list, and the most recently entered surface wins:

```gdscript title="car.gd" ins={1,8-10,17-23}
var _surfaces: Array[Surface] = []

# ...

## How the ground under the car changes it: x multiplies top speed, y multiplies grip.
func _surface_factors() -> Vector2:
	off_road = false
	if not _surfaces.is_empty():
		var surface: Surface = _surfaces.back()
		return Vector2(surface.top_speed, surface.grip)
	if track and track.is_off_road(global_position):
		off_road = true
		return Vector2(off_road_speed, off_road_grip)
	return Vector2.ONE


## Called by Surface areas when the car drives onto or off them.
func enter_surface(surface: Surface) -> void:
	_surfaces.append(surface)


func exit_surface(surface: Surface) -> void:
	_surfaces.erase(surface)
```

Surfaces come before the off-road check, so a napkin lying half off the road behaves the same on both halves.

## Spills on the breakfast table

In `breakfast.tscn`, add a `Node2D` named `Surfaces` **above** `Props` in the tree (so props draw on top of spills), with two surfaces. Each is an `Area2D` with `surface.gd` and a `CollisionShape2D`. Set **Collision → Layer** to `surfaces`, **Mask** to `cars`, and turn off **Monitorable**:

| Surface | Shape | Position | Colour | Grip | Top speed |
| --- | --- | --- | --- | --- | --- |
| `JuiceSpill` | circle r 30 | (1108, 440) | `#ff9a1f`, alpha 55% | 0.25 | 1.0 |
| `Napkin` | rect 84×84, rotation 0.5 rad | (240, 520) | `#f2f2f2`, alpha 70% | 1.0 | 0.6 |

The juice sits on the fast right-hand bend, exactly where you want grip. Hit it flat out and the car carries on sliding towards the kerb. Lift off before it, or take a tighter line around it.

```quiz
question: A car drives off the road onto the napkin. Which factors apply?
options:
  - The off-road factors, because it's off the road
  - The napkin's, because surfaces are checked before the off-road test
  - Both, multiplied together
answer: 1
```

```quiz
question: Why does the car keep a list of surfaces instead of a single "current surface" variable?
options:
  - Areas can only be stored in arrays
  - It can be on two at once; with one variable, leaving the first would forget it's still on the second
  - Lists are faster
answer: 1
explain: Enter A, enter B, leave A. With a single variable you'd set "none" when leaving A, although the car is still on B. The list just removes A.
```
