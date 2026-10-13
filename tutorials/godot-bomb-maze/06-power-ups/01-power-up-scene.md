---
title: The power-up scene
description: An enum for the kinds, an Area2D to pick it up, and stats on the bomber.
estimatedMinutes: 15
---

Three kinds of power-up, one scene:

| Kind | Icon | Effect | Cap |
| --- | --- | --- | --- |
| `BOMB` | a bomb | +1 bomb at a time | 8 |
| `FIRE` | a flame | +1 blast reach | 8 |
| `SPEED` | a winged boot | +12 px/s | 120 px/s |

## The scene

```text
PowerUp (Area2D)        # Layer: power_ups, Mask: bombers
├── CollisionShape2D    # RectangleShape2D, 16×16
└── Sprite2D            # art/power_ups.png, Animation → Hframes: 3
```

The 16×16 shape means a bomber has to really step onto the power-up, not just brush past. Connect the area's `body_entered` to itself and save as `power_up.tscn`.

```gdscript title="power_up.gd"
class_name PowerUp
extends Area2D
## An upgrade left behind by a destroyed block.

enum Kind { BOMB, FIRE, SPEED }

## A revealed power-up ignores the blast that uncovered it for this long.
const SPAWN_PROTECTION := 0.6

@export var kind := Kind.BOMB

var _age := 0.0

@onready var sprite: Sprite2D = $Sprite2D


func _ready() -> void:
	sprite.frame = kind
	var tween := create_tween().set_loops()
	tween.tween_property(sprite, "position:y", -2.0, 0.4).set_trans(Tween.TRANS_SINE)
	tween.tween_property(sprite, "position:y", 0.0, 0.4).set_trans(Tween.TRANS_SINE)


func _process(delta: float) -> void:
	_age += delta


func _on_body_entered(body: Node2D) -> void:
	if body is Bomber and body.alive and not is_queued_for_deletion():
		body.collect(kind)
		queue_free()


func burn() -> void:
	if _age >= SPAWN_PROTECTION:
		queue_free()
```

- **`enum Kind { BOMB, FIRE, SPEED }`** gives the kinds names. Under the hood they're 0, 1 and 2, which is also the order of the icons in `power_ups.png`, so `sprite.frame = kind` picks the right icon.
- **`@export var kind`** with an enum type shows a dropdown in the Inspector, handy for testing: drop a power-up into the arena scene and pick its kind.
- **`is_queued_for_deletion()`** guards against two bombers stepping on it in the same physics step: `queue_free()` only frees at the end of the frame, and the second bomber shouldn't get a free copy.
- `burn()` lets flames destroy an exposed power-up. `SPAWN_PROTECTION` and `_age` are explained on the next page.

## Collecting

The bomber applies the effect. Add the limits as constants, a signal, and a `collect` method:

```gdscript title="bomber.gd" ins={2,4-6}
signal bomb_placed
signal powered_up(kind: PowerUp.Kind)

const MAX_SPEED := 120.0
const MAX_BOMBS := 8
const MAX_POWER := 8
```

```gdscript title="bomber.gd"
func collect(kind: PowerUp.Kind) -> void:
	match kind:
		PowerUp.Kind.BOMB:
			max_bombs = mini(max_bombs + 1, MAX_BOMBS)
		PowerUp.Kind.FIRE:
			power = mini(power + 1, MAX_POWER)
		PowerUp.Kind.SPEED:
			speed = minf(speed + 12.0, MAX_SPEED)
	powered_up.emit(kind)
```

`match` is GDScript's switch statement. The enum makes it read like a sentence, and `mini`/`minf` cap each stat. `PowerUp.Kind` works from another script because `power_up.gd` has a `class_name`.

```quiz
question: Why does `sprite.frame = kind` show the right icon?
options:
  - Godot matches enum names to frame names
  - The enum values are 0, 1, 2 in the same order as the icons in power_ups.png
  - The Sprite2D reads the kind automatically
answer: 1
```

```quiz
question: Two bombers step onto the same power-up in the same physics step. Who gets it?
options:
  - Both
  - Whichever bomber's body_entered fires first; the second call sees is_queued_for_deletion() and does nothing
  - Neither
answer: 1
```
