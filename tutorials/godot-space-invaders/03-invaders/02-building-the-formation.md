---
title: Building the formation
description: Instancing 55 invaders in a loop.
estimatedMinutes: 15
---

Placing 55 invaders by hand would be tedious, and we'd have to do it again for every wave. A loop does it perfectly in a few lines.

## The Formation node

In `game.tscn`, add a `Node2D` named `Formation` at position (0, 0) and attach a script, `formation.gd`. Every invader becomes a child of this node. That's the trick that makes marching easy: move the `Formation` node, and all of its children move with it.

```gdscript title="formation.gd"
extends Node2D
## Builds the grid of invaders, marches it across the screen and makes it shoot.

const INVADER_SCENE := preload("res://invader.tscn")
const COLUMNS := 11
## The kind of invader in each row, top to bottom.
const ROWS := [Invader.Kind.SQUID, Invader.Kind.CRAB, Invader.Kind.CRAB, Invader.Kind.OCTOPUS, Invader.Kind.OCTOPUS]
const SPACING := Vector2(32, 24)
const TOP := 64.0
const DROP := 12.0

var _invaders: Array[Invader] = []
var _total := 0


## Line up a fresh formation. Each wave starts one drop lower, up to six drops.
func build(wave: int) -> void:
	for invader in _invaders:
		invader.queue_free()
	_invaders.clear()
	position = Vector2.ZERO
	var width := (COLUMNS - 1) * SPACING.x
	var origin := Vector2((get_viewport_rect().size.x - width) / 2, TOP + DROP * mini(wave - 1, 6))
	for row in ROWS.size():
		for column in COLUMNS:
			var invader: Invader = INVADER_SCENE.instantiate()
			invader.kind = ROWS[row]
			invader.column = column
			invader.position = origin + Vector2(column, row) * SPACING
			add_child(invader)
			_invaders.append(invader)
	_total = _invaders.size()


func count() -> int:
	return _invaders.size()
```

Step by step:

- `ROWS` lists the kind of each row, top to bottom. Want a meaner formation? Make it all squids.
- `width` is the distance from the first column's centre to the last: 10 gaps of 32 pixels. Centring that on the 640-pixel screen gives the `origin`, the centre of the top-left invader: (160, 64).
- `Vector2(column, row) * SPACING` multiplies component by component: column 3, row 2 lands at (96, 48) from the origin.
- `TOP + DROP * mini(wave - 1, 6)` makes each wave start one drop lower than the last, up to six drops. Wave 1 starts at the top. We'll pass real wave numbers in chapter 7.
- `kind` and `column` are set *before* `add_child`, because adding the node to the tree runs its `_ready()`, which needs `kind` to pick the animation.
- `_invaders` is a **typed array**, `Array[Invader]`. It only accepts invaders, and the editor can autocomplete their methods. Keeping our own list (instead of using `get_children()`) means we'll never trip over the Formation's other children, like the timers we add next.
- `build` starts by clearing out any old invaders and resetting the position, so the next wave can call it again.

## Call it

Give `game.tscn` a script:

```gdscript title="game.gd"
extends Node2D

@onready var formation: Node2D = $Formation


func _ready() -> void:
	formation.build(1)
```

`@onready` fills the variable just before `_ready()` runs, once the child nodes exist. `$Formation` is shorthand for `get_node("Formation")`.

Run the game: five neat rows of invaders hang above your cannon.

```quiz
question: Where does the invader in column 10, row 4 of wave 1 end up?
options:
  - (480, 160)
  - (320, 160)
  - (480, 136)
answer: 0
explain: The origin is (160, 64). Add (10 × 32, 4 × 24) = (320, 96) and you get (480, 160).
```
