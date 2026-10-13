---
title: Wandering monsters
description: Grid-stepping movement without physics, random turns, and death on touch.
estimatedMinutes: 20
---

A monster drifts around the arena. Touch one and you die; catch one in a blast and it pops.

## The scene

```text
Monster (Area2D)         # Layer: monsters, Mask: bombers, group "monsters"
├── CollisionShape2D     # RectangleShape2D, 16×16
└── AnimatedSprite2D     # "float": both frames of art/monster.png, 4 FPS, autoplay
```

A monster is an `Area2D`, not a physics body. It never needs to slide along walls, because it only ever moves from the centre of one free cell to the centre of the next. The area is just there to notice bombers (its mask) and to be noticed by flames (its layer, `monsters`, is in the explosion's mask).

Connect `body_entered` to the monster itself, and save it as `monster.tscn`.

```gdscript title="monster.gd"
class_name Monster
extends Area2D
## A wandering monster. Walks cell to cell, turns at random, and kills on touch.

@export var speed := 40.0
## Chance of turning at a crossing even when the way ahead is open.
@export_range(0.0, 1.0) var turn_chance := 0.3

## Set by the game before the monster enters the tree.
var arena: Arena
## The cell we're walking to (or standing in), and the way we're heading.
var cell := Vector2i.ZERO
var direction := Vector2i.ZERO
var alive := true

@onready var sprite: AnimatedSprite2D = $AnimatedSprite2D


func _ready() -> void:
	cell = arena.cell_at(position)


func _physics_process(delta: float) -> void:
	var target := arena.cell_center(cell)
	position = position.move_toward(target, speed * delta)
	if position == target:
		_choose_direction()
		cell += direction


func _choose_direction() -> void:
	var options: Array[Vector2i] = []
	for option in Arena.DIRECTIONS:
		# Turning back is a last resort, so monsters don't jitter in place.
		if option != -direction and arena.is_free(cell + option):
			options.append(option)
	if options.is_empty():
		direction = -direction if arena.is_free(cell - direction) else Vector2i.ZERO
	elif not options.has(direction) or randf() < turn_chance:
		direction = options.pick_random()


func _on_body_entered(body: Node2D) -> void:
	if alive and body is Bomber:
		body.die()


func burn() -> void:
	if not alive:
		return
	alive = false
	set_physics_process(false)
	set_deferred("monitoring", false)
	set_deferred("monitorable", false)
	var tween := create_tween()
	tween.tween_property(sprite, "scale", Vector2(1.6, 1.6), 0.15)
	tween.parallel().tween_property(sprite, "modulate:a", 0.0, 0.15)
	tween.tween_callback(queue_free)
```

### Grid stepping

`cell` is the cell the monster is walking *to*. Every physics tick it moves towards that cell's centre with `move_toward`, which never overshoots. When it arrives (`position == target` is exact, thanks to `move_toward`), it picks a direction and moves `cell` one step on.

`_choose_direction` lists the free neighbours, leaving out the way it came:

- No options at all (a dead end): turn around if possible, otherwise stand still and try again next tick. A monster boxed in by blocks starts moving the moment a blast frees it.
- The current direction is still open: keep going, except for a `turn_chance` (30%) of taking a random option anyway, so monsters don't just bounce between two walls.
- Otherwise: pick any open option.

Because it checks `arena.is_free`, a monster treats bombs as walls, just like bombers do.

### Touching and burning

`body_entered` only reports bodies in the mask, so the only bodies a monster sees are bombers, and touching one calls `die()`. The explosion calls `burn()` because the monster has that method (duck typing again). Dying switches off monitoring with `set_deferred` (we're inside a physics callback) and plays a quick pop: grow, fade, free.

## Spawning monsters

Monsters shouldn't start next to a bomber. The arena can list free cells far from every spawn corner:

```gdscript title="arena.gd"
## Floor cells that are free and at least `distance` steps from every spawn.
func free_cells_away_from_spawns(distance: int) -> Array[Vector2i]:
	var spawns := spawn_cells()
	var result: Array[Vector2i] = []
	for cell in floor_layer.get_used_cells():
		if is_free(cell) and not _near_any(cell, spawns, distance - 1):
			result.append(cell)
	return result
```

And the game spawns a few into the same `Actors` container as the bombers:

```gdscript title="game.gd" ins={1,4,11}
const MONSTER_COUNT := 3

@export var bomber_scene: PackedScene
@export var monster_scene: PackedScene

# ...

func _ready() -> void:
	arena.generate()
	_spawn_bombers()
	_spawn_monsters()


func _spawn_monsters() -> void:
	var cells := arena.free_cells_away_from_spawns(5)
	cells.shuffle()
	for i in mini(MONSTER_COUNT, cells.size()):
		var monster: Monster = monster_scene.instantiate()
		monster.arena = arena
		monster.position = arena.cell_center(cells[i])
		arena.actors.add_child(monster)
```

Assign `monster.tscn` to **Monster Scene**. Five steps away from every corner gives a player a few seconds before the first monster arrives. `mini(MONSTER_COUNT, cells.size())` copes with an unlucky arena with very few free cells.

```quiz
question: Why is the monster an Area2D instead of a CharacterBody2D?
options:
  - Area2D nodes move faster
  - It moves from cell centre to cell centre through free cells only, so it never collides with anything; it only needs to detect overlaps
  - CharacterBody2D can't be killed by explosions
answer: 1
```

```quiz
question: A monster is in a corridor with walls on both sides, heading right, and the cell to its right is free. With turn_chance 0.3, what does `_choose_direction` do?
options:
  - Always keeps going right
  - Keeps going right; if the 30% roll hits it picks randomly from the options, which here is only right
  - Turns around 30% of the time
answer: 1
explain: The way back is excluded from `options`, and up and down are walls, so `options` is just `[RIGHT]`. Even a random pick keeps it going right.
```
