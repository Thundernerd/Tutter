---
title: Flames
description: An Area2D built from code, with sprites per cell, two rectangles for collision, and burning whatever it touches.
estimatedMinutes: 25
---

## The explosion scene

The flames are an `Area2D`: they don't block anything, they only need to know what's touching them.

```text
Explosion (Area2D)    # Layer: flames, Mask: bombers, monsters, power_ups
```

That's the whole scene. The sprites and collision shapes depend on the blast, so the script creates them. Connect the area's own `body_entered` and `area_entered` signals to itself (bombers are bodies; monsters and power-ups, coming later, are areas), and save it as `explosion.tscn`.

```gdscript title="explosion.gd"
class_name Explosion
extends Area2D
## The flames of one blast. Burns whatever touches them while they last.

const FLAME_TEXTURE := preload("res://art/flame.png")
const LIFETIME := 0.5
## Flames are narrower than a tile, so grazing one from the next lane is safe.
const THICKNESS := 14.0

## The cells on fire, centre first. Set by the arena before adding us.
var cells: Array[Vector2i] = []
var arena: Arena


func _ready() -> void:
	var origin := cells[0]
	for cell in cells:
		_add_sprite(cell, origin)
	_add_arm_shapes(origin)
	var tween := create_tween()
	tween.tween_property(self, "modulate:a", 0.0, 0.2).set_delay(LIFETIME - 0.2)
	tween.tween_callback(queue_free)


func _add_sprite(cell: Vector2i, origin: Vector2i) -> void:
	var sprite := Sprite2D.new()
	sprite.texture = FLAME_TEXTURE
	sprite.hframes = 3
	sprite.position = arena.cell_center(cell) - position
	var offset := cell - origin
	if offset != Vector2i.ZERO:
		var direction := offset.sign()
		sprite.rotation = Vector2(direction).angle()
		# Frame 2 is the rounded tip, for the last cell of an arm.
		sprite.frame = 1 if cells.has(cell + direction) else 2
	add_child(sprite)


## Two rectangles cover the whole cross: one horizontal, one vertical.
func _add_arm_shapes(origin: Vector2i) -> void:
	var first := origin
	var last := origin
	for cell in cells:
		first = first.min(cell)
		last = last.max(cell)
	# Centres of the outermost cells, relative to the explosion.
	var from := arena.cell_center(first) - position
	var to := arena.cell_center(last) - position
	var tile := Vector2(arena.walls.tile_set.tile_size)
	_add_rect(Vector2(from.x, 0), Vector2(to.x, 0), Vector2(tile.x, THICKNESS))
	_add_rect(Vector2(0, from.y), Vector2(0, to.y), Vector2(THICKNESS, tile.y))


func _add_rect(from: Vector2, to: Vector2, padding: Vector2) -> void:
	var shape := RectangleShape2D.new()
	shape.size = (to - from).abs() + padding
	var collision := CollisionShape2D.new()
	collision.shape = shape
	collision.position = (from + to) / 2
	add_child(collision)


func _on_body_entered(body: Node2D) -> void:
	if body.has_method("burn"):
		body.burn()


func _on_area_entered(area: Area2D) -> void:
	if area.has_method("burn"):
		area.burn()
```

### Sprites

`flame.png` has three 24×24 frames: a **centre** (a plus), a **middle** piece (a horizontal band) and an **end** piece (a band with a rounded tip pointing right). With `hframes = 3`, `frame` picks one.

For an arm cell, `offset.sign()` is the arm's direction, like `(0, -1)` for the up arm, and `Vector2(direction).angle()` turns it into a rotation: right is 0, down is 90°, and so on. So the end piece, drawn pointing right, points the right way on every arm. A cell is an end piece if the next cell along the arm isn't on fire.

### Collision

Instead of one shape per cell, the whole cross is **two rectangles**. `first` and `last` are the minimum and maximum cell coordinates of the blast (`Vector2i.min` and `max` work per component), so one rectangle spans the horizontal arm and the other the vertical one.

The rectangles are only 14 pixels thick, narrower than a tile. A bomber passing by in the next lane, with a few pixels of its box poking into the blast's row, survives. Fair beats precise.

### Lifetime

A single tween does it: wait until 0.2 s before the end, fade out, then free the node. No Timer node needed.

### Burning

When something enters the flames, we don't care what it is, only whether it has a `burn()` method. Bombers, monsters and power-ups will each implement `burn()` their own way. This is **duck typing**: the explosion doesn't need to know any of those classes.

:::tip[Bodies already inside]
A bomber standing in the blast when the explosion appears isn't "entering". It's already there. Godot still reports it: on the first physics step after an `Area2D` is added, every overlapping body triggers `body_entered`.
:::

## Spawning flames

The arena creates the explosion when a bomb goes off, and announces it with a signal for sounds and effects later:

```gdscript title="arena.gd" ins={1,4,6,11-17}
signal exploded(cells: Array[Vector2i])

@export var bomb_scene: PackedScene
@export var explosion_scene: PackedScene

@onready var flames: Node2D = $Flames


func _on_bomb_exploded(bomb: Bomb) -> void:
	bombs.erase(bomb.cell)
	var cells := blast_cells(bomb.cell, bomb.power)
	var explosion: Explosion = explosion_scene.instantiate()
	explosion.arena = self
	explosion.cells = cells
	explosion.position = cell_center(bomb.cell)
	flames.add_child(explosion)
	exploded.emit(cells)
```

Drag `explosion.tscn` into the arena's **Explosion Scene**. `cells` and `arena` are set before `add_child`, so they're ready when the explosion's `_ready` runs.

## Dying

Bombers need `burn()`. For now, dying just means disappearing; the polish chapter adds an animation.

```gdscript title="bomber.gd" ins={1,4,7,11}
signal died(bomber: Bomber)

# ...
var alive := true

@onready var sprite: AnimatedSprite2D = $AnimatedSprite2D
@onready var collision: CollisionShape2D = $CollisionShape2D


func can_place_bomb() -> bool:
	return alive and active_bombs < max_bombs


## Called by flames and falling walls.
func burn() -> void:
	die()


func die() -> void:
	if not alive:
		return
	alive = false
	input_direction = Vector2.ZERO
	set_physics_process(false)
	collision.set_deferred("disabled", true)
	sprite.stop()
	died.emit(self)
	hide()
```

- `set_physics_process(false)` stops movement and input.
- **`set_deferred("disabled", true)`**: `burn()` is called from `body_entered`, which fires *while* the physics engine processes collisions. Changing collision shapes at that moment is not allowed (Godot prints "Can't change this state while flushing queries"). `set_deferred` applies the change at the end of the frame instead.

Run it and blow yourself up. The flames cover the cross, and walking into lingering flames kills too.

```quiz
question: Why does the explosion check `has_method("burn")` instead of `body is Bomber`?
options:
  - is checks are slow
  - Anything with a burn() method can burn (bombers, monsters, power-ups) without the explosion knowing their classes
  - Bomber isn't a class
answer: 1
```

```quiz
question: Why does `die()` use `collision.set_deferred("disabled", true)` instead of `collision.disabled = true`?
options:
  - It's called during the physics engine's collision processing, when shapes can't be changed
  - set_deferred is the only way to change a bool property
  - To make the death animation smoother
answer: 0
```
