---
title: Obstacles
description: Props that draw themselves from their collision shape, table edges, and bouncing off things.
estimatedMinutes: 25
---

A breakfast table needs breakfast on it. Props are solid: a cereal bowl, a mug, a slice of toast. You can't drive through them, so they shape the racing line, and they punish cutting corners far harder than the off-road slowdown does.

## One script for every prop

Every prop is a `StaticBody2D` with a `CollisionShape2D`. Instead of drawing each one separately, a tool script draws whatever shape the collision shape has, so what you see is always exactly what you hit.

Create `prop.gd`:

```gdscript title="prop.gd"
@tool
class_name Prop
extends StaticBody2D
## A solid object on the table: a mug, a book, a pool ball. It draws itself to match
## its CollisionShape2D, which can be a circle or a rectangle.

@export var color := Color("f4f1ea"):
	set(value):
		color = value
		queue_redraw()
## Optional second colour drawn inside the shape, like the coffee in a mug.
@export var inner_color := Color.TRANSPARENT:
	set(value):
		inner_color = value
		queue_redraw()

@onready var collision: CollisionShape2D = $CollisionShape2D


func _ready() -> void:
	if collision.shape:
		collision.shape.changed.connect(queue_redraw)


func _draw() -> void:
	draw_set_transform_matrix(collision.transform)
	var shape := collision.shape
	if shape is CircleShape2D:
		var r: float = shape.radius
		draw_circle(Vector2(3, 3), r, Color(0, 0, 0, 0.25)) # shadow
		draw_circle(Vector2.ZERO, r, color)
		if inner_color.a > 0.0:
			draw_circle(Vector2.ZERO, r * 0.72, inner_color)
		draw_arc(Vector2.ZERO, r, 0.0, TAU, 48, color.darkened(0.3), 2.0)
	elif shape is RectangleShape2D:
		var rect := Rect2(-shape.size / 2.0, shape.size)
		draw_rect(Rect2(rect.position + Vector2(3, 3), rect.size), Color(0, 0, 0, 0.25))
		draw_rect(rect, color)
		if inner_color.a > 0.0:
			draw_rect(rect.grow(-4.0), inner_color)
		draw_rect(rect, color.darkened(0.3), false, 2.0)
```

- Resources like shapes emit `changed` when edited. Connecting it to `queue_redraw` means that dragging the shape's handles in the editor redraws the prop live.
- `draw_set_transform_matrix(collision.transform)` makes the drawing follow the collision shape's own position and rotation, in case you moved the shape inside the prop.
- `shape is CircleShape2D` is a type check. Inside that branch we read `shape.radius`; the `: float` annotation keeps it typed, since `shape` itself is just a `Shape2D`.

## Placing props

In `breakfast.tscn`, add a `Node2D` named `Props`, and give it children like this one:

```text
Props (Node2D)
└── CerealBowl (StaticBody2D)    # script: prop.gd, position (600, 430)
    └── CollisionShape2D         # CircleShape2D, radius 62
```

Set the body's collision **Layer** to `walls` and clear its **Mask** (static bodies never look for anything). Then set its colours: cream `#f4f1ea` for the bowl and a golden `#e9b84a` inner colour for the cereal.

Here's the full breakfast:

| Prop | Shape | Position | Colour / inner |
| --- | --- | --- | --- |
| `CerealBowl` | circle r 62 | (600, 430) | `#f4f1ea` / `#e9b84a` |
| `Mug` | circle r 26 | (940, 450) | `#5a8fd0` / `#5b3a22` |
| `Toast` | rect 72×64, rotation 0.3 rad | (300, 320) | `#c98a43` / `#efc883` |
| `Teapot` | circle r 34 | (1140, 640) | `#e0e0e0` / `#c8c8c8` |
| `Jam` | circle r 20 | (420, 470) | `#f4f1ea` / `#b0283a` |

:::warning[Duplicated props share their shape]
If you make a prop and press <kbd>Ctrl</kbd>+<kbd>D</kbd> to duplicate it, both copies point at the *same* `CircleShape2D` resource, so resizing one resizes both. Right-click the shape in the Inspector and choose **Make Unique** before resizing a copy.
:::

## The table edges

Without walls, a car could drive off the table into the void. The track builds four invisible walls around the table at runtime (in the editor they'd only get in the way):

```gdscript title="track.gd" ins={7,10-29}
func _ready() -> void:
	# ...
	if Engine.is_editor_hint():
		# Redraw while the curve is edited, so the editor shows the real road.
		curve.changed.connect(_build_road)
		return
	_build_table_edges()


## Invisible walls just outside the table, so nobody drives off the edge.
func _build_table_edges() -> void:
	var edges := StaticBody2D.new()
	edges.name = "TableEdges"
	edges.collision_mask = 0
	var thickness := 100.0
	var rects: Array[Rect2] = [
		Rect2(-thickness, -thickness, table_size.x + thickness * 2.0, thickness), # top
		Rect2(-thickness, table_size.y, table_size.x + thickness * 2.0, thickness), # bottom
		Rect2(-thickness, 0, thickness, table_size.y), # left
		Rect2(table_size.x, 0, thickness, table_size.y), # right
	]
	for rect in rects:
		var shape := RectangleShape2D.new()
		shape.size = rect.size
		var collision := CollisionShape2D.new()
		collision.shape = shape
		collision.position = rect.get_center()
		edges.add_child(collision)
	add_child(edges)
```

A new `StaticBody2D` is on layer 1 (`walls`) by default, which is exactly what we want. The walls are 100 px thick so even a very fast car can't tunnel through them in one physics tick.

## Bouncing off things

Drive into the bowl now. `move_and_slide()` stops the car and slides it along the surface, which works, but it's a bit dead. A small bounce feels much better. After moving, `get_slide_collision()` tells us what we hit and the **normal**: the direction pointing out of the surface, away from it.

```gdscript title="car.gd" ins={4,6,9-23}
func _physics_process(delta: float) -> void:
	_read_input()
	_drive(delta)
	var impact_velocity := velocity
	move_and_slide()
	_handle_collisions(impact_velocity)


func _handle_collisions(impact_velocity: Vector2) -> void:
	for i in get_slide_collision_count():
		var collision := get_slide_collision(i)
		var normal := collision.get_normal()
		# How fast we were moving into whatever we hit.
		var impact := -impact_velocity.dot(normal)
		if impact <= 0.0:
			continue
		var other := collision.get_collider()
		if other is Car:
			# Shove the other car; we keep some of the knock ourselves.
			other.velocity -= normal * impact * 0.6
			velocity += normal * impact * 0.15
		else:
			velocity += normal * impact * 0.3 # A small bounce off walls and props.
```

The velocity *before* moving tells us how hard we hit (`move_and_slide()` has already removed the part going into the wall), which is why we save a copy first. Its dot product with the normal is negative when moving into the surface, so `-dot` is the **impact speed**. Pushing back along the normal with 30% of that speed gives a gentle rebound.

The `Car` branch is for car-to-car contact, which we'll get once there's more than one car. A `CharacterBody2D` never gets pushed by other bodies on its own, so we shove the other car ourselves and keep a little of the knock. Rubbing is racing!

## Collision layers recap

| Body | Layer | Mask |
| --- | --- | --- |
| Car | `cars` | `walls`, `cars` |
| Props, table edges | `walls` | none |

Run the game: the table is full of breakfast, the edges hold you in, and the props bounce you off.

```quiz
question: A car moving at velocity (200, 0) hits a wall whose normal is (-1, 0). What is the impact speed?
options:
  - "-200"
  - "0"
  - "200"
answer: 2
explain: '`impact_velocity.dot(normal)` is 200 × -1 = -200, and the code negates it: the car hit the wall at 200 px/s.'
```

```quiz
question: Why does the car save `velocity` before calling `move_and_slide()`?
options:
  - move_and_slide resets velocity to zero
  - After sliding, the part of the velocity going into the wall is gone, so the impact speed can't be measured any more
  - Saving it makes the physics deterministic
answer: 1
```
