---
title: Brick types as resources
description: A custom Resource class for colour, toughness and points.
estimatedMinutes: 20
---

Our game will have six kinds of brick: four colours that break in one hit, a silver brick that takes two, and steel that never breaks. Each kind has a colour, hit points, a score value and an "unbreakable" flag.

You could put all of that in a big dictionary in code. Godot has a better tool: a **custom resource**.

## Resources

A *resource* is a piece of data Godot can save to a file and load again: textures, sounds, scenes and fonts are all resources. You can make your own by extending `Resource`. Its `@export` variables become fields you edit in the Inspector, and each set of values is saved as a small `.tres` file.

Create a new script (**File → New Script**, not attached to anything) named `brick_type.gd`:

```gdscript title="brick_type.gd"
class_name BrickType
extends Resource
## One kind of brick: its colour, how tough it is, and what it's worth.

@export var color := Color.WHITE
## Hits needed to break the brick.
@export_range(1, 5) var hit_points := 1
## Score for breaking it.
@export var points := 10
## Unbreakable bricks bounce the ball forever and don't count towards clearing the level.
@export var unbreakable := false
```

`class_name BrickType` registers a new global type. You can now write `BrickType` in any script, use it as a variable type, and pick it in Godot's "new resource" dialogs.

## Making the types

In the FileSystem dock, create a `bricks` folder. Right-click it → **Create New → Resource…**, search for `BrickType`, and save it as `red.tres`. Select it and fill in the Inspector. Repeat for all six:

| File | Color | Hit Points | Points | Unbreakable |
| --- | --- | --- | --- | --- |
| `red.tres` | `#e5534b` | 1 | 30 | off |
| `yellow.tres` | `#f5c542` | 1 | 20 | off |
| `green.tres` | `#5cc46a` | 1 | 10 | off |
| `blue.tres` | `#4a9ff5` | 1 | 10 | off |
| `silver.tres` | `#b8c4d6` | 2 | 50 | off |
| `steel.tres` | `#5a6478` | 1 | 0 | **on** |

:::tip
Make `red.tres`, then right-click it → **Duplicate…** for the others. You only change what's different.
:::

## Bricks that know their type

The brick now takes its colour and hit points from a `BrickType` instead of its own export:

```gdscript title="brick.gd" ins={3-4,8-17,22-24,27-31} del={7,26}
extends StaticBody2D

## Emitted when a hit doesn't break the brick (including unbreakable ones).
signal damaged
signal destroyed

@export var hit_points := 1
@export var type: BrickType

var hit_points := 1

@onready var rect: ColorRect = $ColorRect


func _ready() -> void:
	hit_points = type.hit_points
	rect.color = type.color


## Called by the ball when it bounces off this brick.
func hit() -> void:
	if type.unbreakable:
		damaged.emit()
		return
	hit_points -= 1
	if hit_points <= 0:
	if hit_points > 0:
		# Darker means closer to breaking.
		rect.color = type.color.darkened(0.5 * (1.0 - float(hit_points) / type.hit_points))
		damaged.emit()
	else:
		destroyed.emit()
		queue_free()
```

- `@export var type: BrickType` gives the brick a slot in the Inspector that only accepts `BrickType` resources.
- Many bricks share one `red.tres`. That's fine, because the brick copies `hit_points` into its own variable in `_ready()` and only ever changes the copy. Change the resource itself and you'd damage every red brick at once!
- A damaged brick gets darker: `darkened(0.25)` after the first hit on a silver brick. `float(...)` matters: `1 / 2` with two integers is `0` in GDScript.
- Steel emits `damaged` too. It's still a hit, and the polish chapter plays a "clink" sound for it.

To try it, instance a brick in `game.tscn` and drag `silver.tres` onto its **Type** slot.

```quiz
question: Why does the brick copy `type.hit_points` into its own variable instead of decreasing `type.hit_points` directly?
options:
  - Resources are read-only
  - All bricks of that type share the same resource, so changing it would affect every one of them
  - It's faster
answer: 1
explain: A resource loaded from a `.tres` file is shared by everything that uses it. Per-brick state belongs in the brick.
```

```quiz
question: In GDScript, what is `1 / 2`?
type: text
answer: ["0"]
hint: Both numbers are integers.
explain: Integer division drops the remainder. `float(1) / 2` or `1.0 / 2` gives 0.5.
```
