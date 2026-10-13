---
title: The invader scene
description: AnimatedSprite2D, SpriteFrames, an enum, and resources that are local to scene.
estimatedMinutes: 20
---

There are three kinds of invader: squids in the top row, crabs in the next two, octopuses in the bottom two. They differ only in their picture and their points, so one scene with a `kind` setting covers all three.

## Nodes

New scene, `Area2D` root named `Invader`:

```text
Invader (Area2D)
├── AnimatedSprite2D   # SpriteFrames with squid, crab and octopus animations
└── CollisionShape2D   # RectangleShape2D 24×16, Local To Scene on
```

## SpriteFrames

An `AnimatedSprite2D` plays animations stored in a **SpriteFrames** resource. Select the node, click the **Sprite Frames** slot in the Inspector and choose **New SpriteFrames**. Click the new resource and the **SpriteFrames** panel opens at the bottom of the editor.

1. Rename the `default` animation to `octopus`. Drag `octopus_1.png` and `octopus_2.png` from the FileSystem dock into the frames area.
2. Click **Add Animation**, name it `crab`, and add `crab_1.png` and `crab_2.png`.
3. Do the same for `squid`.

Leave autoplay off. Invaders don't animate on a clock: they swap frames *each time the formation steps*, so the legs move in time with the march. The script will flip the frame by hand.

## Local To Scene

Select the `CollisionShape2D`, give it a new `RectangleShape2D`, then click the shape and tick **Resource → Local To Scene**.

Why? **Resources are shared.** Every instance of `invader.tscn` points to the *same* `RectangleShape2D`. Our script will resize the hitbox to fit each kind: squids are 16 pixels wide, octopuses 24. With one shared shape, every invader's resize would overwrite everyone else's, and all 55 would end up with whatever size was set last. **Local To Scene** gives each instance its own copy.

Save as `invader.tscn`.

## The script

```gdscript title="invader.gd"
class_name Invader
extends Area2D
## One alien in the formation. The formation moves it; it only animates and dies.

enum Kind { SQUID, CRAB, OCTOPUS }

# Both arrays are indexed by Kind.
const ANIMATIONS: Array[StringName] = [&"squid", &"crab", &"octopus"]
const POINTS: Array[int] = [30, 20, 10]

@export var kind := Kind.OCTOPUS

## The formation column this invader stands in. Set by the formation.
var column := 0

@onready var sprite: AnimatedSprite2D = $AnimatedSprite2D
@onready var shape: CollisionShape2D = $CollisionShape2D


func _ready() -> void:
	sprite.animation = ANIMATIONS[kind]
	# Squids are narrower than octopuses: fit the hitbox to this kind's sprite.
	shape.shape.size = sprite.sprite_frames.get_frame_texture(sprite.animation, 0).get_size()


## Show the other animation frame. Called on every formation step.
func step() -> void:
	sprite.frame = 1 - sprite.frame


func get_points() -> int:
	return POINTS[kind]
```

- **`class_name Invader`** registers a global type. Other scripts can now write `Invader` as a type (`var invader: Invader`) and reach its enum as `Invader.Kind.SQUID`.
- **An enum** names a set of integer constants: `SQUID` is 0, `CRAB` 1, `OCTOPUS` 2. An exported enum shows up as a dropdown in the Inspector. Because the values are 0, 1 and 2, they double as array indexes: `POINTS[Kind.CRAB]` is 20.
- `1 - sprite.frame` flips between frames 0 and 1.
- The hitbox gets the size of the first frame's texture, so it always matches the picture.

Try it: instance a few invaders in `game.tscn`, set different **Kind** values in the Inspector, and run. Then delete them again; the formation will create them from code.

```quiz
question: You forget to tick Local To Scene, and the formation creates squids first and octopuses last. What size are the squids' hitboxes?
options:
  - 16×16, their own size
  - 24×16, the octopus size, because the shape is shared
  - 0×0
answer: 1
explain: All instances share one shape resource, so the last invader to run `_ready()` (an octopus) sets the size for everyone.
```

```quiz
question: What is `POINTS[Invader.Kind.SQUID]`?
type: text
answer: ["30"]
hint: SQUID is the first value in the enum, so its index is 0.
```
