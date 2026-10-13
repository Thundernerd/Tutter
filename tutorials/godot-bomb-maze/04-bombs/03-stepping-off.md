---
title: Stepping off a bomb
description: Collision exceptions let a bomber leave the bomb it's standing on, and then the bomb blocks it like a wall.
estimatedMinutes: 15
---

The rule every Bomberman-style game follows: you can walk **off** a bomb you just dropped, but once you've stepped off, it's as solid as a wall. It also applies to anyone else who was standing there when the bomb appeared.

## Collision exceptions

Every physics body has a list of bodies it ignores:

```gdscript
bomber.add_collision_exception_with(bomb)     # these two no longer collide
bomber.remove_collision_exception_with(bomb)  # back to normal
```

So the plan is:

1. When a bomb appears, find every bomber touching it and add an exception: those are its **passengers**.
2. Each physics tick, check each passenger. Once one no longer touches the bomb, remove its exception.

"Touching" is simple box maths: the bomb is 24 wide and a bomber 18, so their centres must be closer than 12 + 9 = 21 pixels on *both* axes to overlap.

```gdscript title="bomb.gd" ins={8-9,15-16,28-31,34-44,56-57}
class_name Bomb
extends StaticBody2D
## A bomb on the grid. When it goes off, the arena works out the blast.

signal exploded(bomb: Bomb)

const FUSE_TIME := 2.5
## Closer than this (half a tile plus half a bomber) and a bomber is touching us.
const TOUCH_DISTANCE := 21.0

## The cell this bomb sits in, and how far its blast reaches. Set by the arena.
var cell := Vector2i.ZERO
var power := 2

## Bombers still standing on the bomb since it was placed. They may walk off it.
var _passengers: Array[Bomber] = []
var _exploded := false

@onready var fuse: Timer = $Fuse
@onready var sprite: Sprite2D = $Sprite2D


func _ready() -> void:
	fuse.start(FUSE_TIME)
	var tween := create_tween().set_loops()
	tween.tween_property(sprite, "scale", Vector2(1.15, 0.9), 0.25)
	tween.tween_property(sprite, "scale", Vector2.ONE, 0.25)
	for bomber: Bomber in get_tree().get_nodes_in_group("bombers"):
		if _touches(bomber):
			bomber.add_collision_exception_with(self)
			_passengers.append(bomber)


func _physics_process(_delta: float) -> void:
	# Once a passenger has stepped off, the bomb is solid for them too.
	for bomber in _passengers.duplicate():
		if not _touches(bomber):
			bomber.remove_collision_exception_with(self)
			_passengers.erase(bomber)


func _touches(bomber: Bomber) -> bool:
	var gap := (bomber.global_position - global_position).abs()
	return gap.x < TOUCH_DISTANCE and gap.y < TOUCH_DISTANCE


func _on_fuse_timeout() -> void:
	explode()


## Go off now: when the fuse runs out, or when another blast reaches us.
func explode() -> void:
	if _exploded:
		return
	_exploded = true
	for bomber in _passengers:
		bomber.remove_collision_exception_with(self)
	exploded.emit(self)
	queue_free()
```

- Bombs and bombers live in different containers, so `_touches` compares `global_position`s. Both containers sit at the arena's origin, so `position` would work too, but global positions keep the check correct even if that ever changes.
- We loop over `_passengers.duplicate()` because erasing from an array while looping over it skips elements.
- When the bomb explodes, any remaining passenger gets its exception removed, so no bomber keeps a reference to a body that no longer exists.

:::note[Why not an Area2D?]
An `Area2D` with a `body_exited` signal sounds like the natural fit. The catch is timing: a freshly added area only reports overlaps after the next physics step, but the exceptions have to be in place *immediately*, before the bomber's next `move_and_slide()`. A distance check has no such delay.
:::

Run it. Drop a bomb, walk off it, and try to walk back: it blocks you. Stand still on it until it vanishes, and nothing strange happens.

## Checkpoint

The arena, two bombers and bombs that block. The bombs don't *do* anything yet, which is the next chapter.

```quiz
question: Why does the bomb loop over `_passengers.duplicate()` instead of `_passengers`?
options:
  - duplicate() makes the loop faster
  - The loop erases passengers, and erasing from the array being looped over skips elements
  - Arrays can't be looped over in _physics_process
answer: 1
```

```quiz
type: multiple
question: Player 1 drops a bomb while player 2 is standing in the same cell. Which statements are true? Select all that apply.
options:
  - Both players are passengers and can walk off
  - Only player 1 can walk off; player 2 is stuck
  - After player 2 steps off, the bomb blocks player 2
  - The bomb never blocks player 2 because they didn't place it
answer: [0, 2]
explain: The bomb adds an exception for every bomber touching it when it appears, whoever placed it, and removes each one as that bomber steps off.
```
