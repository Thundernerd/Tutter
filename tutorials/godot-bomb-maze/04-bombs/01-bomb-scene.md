---
title: Dropping bombs
description: A StaticBody2D with a fuse Timer, typed dictionaries, and snapping to the grid.
estimatedMinutes: 20
---

## The bomb scene

A bomb doesn't move, but it should block bombers, so it's a `StaticBody2D`:

```text
Bomb (StaticBody2D)       # Layer: bombs, Mask: none
├── CollisionShape2D      # RectangleShape2D, 24×24
├── Sprite2D              # art/bomb.png
└── Fuse (Timer)          # One Shot on
```

Connect the `Fuse` timer's `timeout` signal to `Bomb` and attach a script:

```gdscript title="bomb.gd"
class_name Bomb
extends StaticBody2D
## A bomb on the grid. When it goes off, the arena works out the blast.

signal exploded(bomb: Bomb)

const FUSE_TIME := 2.5

## The cell this bomb sits in, and how far its blast reaches. Set by the arena.
var cell := Vector2i.ZERO
var power := 2

var _exploded := false

@onready var fuse: Timer = $Fuse
@onready var sprite: Sprite2D = $Sprite2D


func _ready() -> void:
	fuse.start(FUSE_TIME)
	var tween := create_tween().set_loops()
	tween.tween_property(sprite, "scale", Vector2(1.15, 0.9), 0.25)
	tween.tween_property(sprite, "scale", Vector2.ONE, 0.25)


func _on_fuse_timeout() -> void:
	explode()


## Go off now: when the fuse runs out, or when another blast reaches us.
func explode() -> void:
	if _exploded:
		return
	_exploded = true
	exploded.emit(self)
	queue_free()
```

- `fuse.start(FUSE_TIME)` sets the wait time and starts the timer in one call. Keeping the time in a constant means other code (the CPU, later) can read `Bomb.FUSE_TIME`.
- A tween with **`set_loops()`** repeats forever: the bomb squashes and stretches every half second, which reads as "ticking". The tween belongs to the bomb, so it stops when the bomb is freed.
- **`explode()`** is public on purpose: in the next chapter, other explosions call it to set off bombs early. The `_exploded` flag makes it safe to call twice.
- The bomb doesn't destroy anything itself. It just announces `exploded` and disappears; the arena, which knows the grid, does the rest.

Save it as `bomb.tscn`.

## Bombs live in the arena

The arena keeps every bomb in a **typed dictionary**, keyed by cell:

```gdscript title="arena.gd" ins={1,3-4,9}
@export var bomb_scene: PackedScene

## Bombs on the field, by cell.
var bombs: Dictionary[Vector2i, Bomb] = {}

@onready var floor_layer: TileMapLayer = $Floor
@onready var walls: TileMapLayer = $Walls
@onready var blocks: TileMapLayer = $Blocks
@onready var bomb_container: Node2D = $Bombs
@onready var actors: Node2D = $Actors
```

`Dictionary[Vector2i, Bomb]` (Godot 4.4+) only accepts `Vector2i` keys and `Bomb` values, and the editor knows that `bombs[cell]` is a `Bomb`. "Is there a bomb here?" becomes `bombs.has(cell)`, with no searching. A bomb is now something you can't walk into:

```gdscript title="arena.gd" ins={3}
## Can a bomber or monster walk into this cell?
func is_free(cell: Vector2i) -> bool:
	return not is_wall(cell) and not is_block(cell) and not bombs.has(cell)
```

Placing and removing bombs:

```gdscript title="arena.gd"
## Put a bomb in a cell. Returns null when there is already one.
func place_bomb(cell: Vector2i, power: int) -> Bomb:
	if bombs.has(cell):
		return null
	var bomb: Bomb = bomb_scene.instantiate()
	bomb.cell = cell
	bomb.power = power
	bomb.position = cell_center(cell)
	bomb.exploded.connect(_on_bomb_exploded)
	bombs[cell] = bomb
	bomb_container.add_child(bomb)
	return bomb


func _on_bomb_exploded(bomb: Bomb) -> void:
	bombs.erase(bomb.cell)
```

Drag `bomb.tscn` into the arena's new **Bomb Scene** property.

The position comes from `cell_center(cell)`, so a bomb always sits exactly in the middle of a cell, wherever in the cell the bomber was standing. That's what makes the game feel grid-based even though bombers move smoothly.

## The bomb key

In `bomber.gd`, check the bomb action every physics tick, and ask the arena for a bomb in the cell we're standing in:

```gdscript title="bomber.gd" ins={3-4,10-11}
func _physics_process(delta: float) -> void:
	input_direction = _read_direction()
	if Input.is_action_just_pressed(controls + "_bomb"):
		place_bomb()
	velocity = _lane_velocity(input_direction, delta)
	move_and_slide()
	_animate(input_direction)


func place_bomb() -> void:
	arena.place_bomb(arena.cell_at(position), 2)
```

Run it and press <kbd>Space</kbd>. A bomb appears, ticks for two and a half seconds, and vanishes. You'll also notice something odd: the bomber gets shoved out of the bomb, sometimes in a strange direction. A solid body just appeared on top of it, and the physics engine pushes them apart. We'll fix that properly in two pages.

```quiz
question: Why does the bomb emit `exploded` instead of destroying blocks itself?
options:
  - Signals are faster than method calls
  - The arena knows the grid (walls, blocks, other bombs), so it's the right place for blast logic; the bomb stays simple
  - StaticBody2D nodes can't change tiles
answer: 1
```

```quiz
question: A bomber standing at position (40, 30) inside the arena presses the bomb key. Where does the bomb appear (24×24 tiles)?
options:
  - (40, 30), right under the bomber
  - (36, 36), the centre of cell (1, 1)
  - (24, 24), the corner of cell (1, 1)
answer: 1
explain: "`cell_at((40, 30))` is (1, 1), and `cell_center` of that is (36, 36). Bombs always snap to the middle of a cell."
```
