---
title: The bunker scene
description: Textures and Images, and giving each bunker its own copy of the pixels.
estimatedMinutes: 15
---

## Nodes

New scene, `Area2D` root named `Bunker`:

```text
Bunker (Area2D)         # group "bunkers"
├── Sprite2D            # texture: sprites/bunker.png (44×32)
└── CollisionShape2D    # RectangleShape2D, 44×32
```

- Collision: **Layer** `bunkers`, **Mask** `invaders`. The bunker watches for invaders marching into it; shots find the bunker through their own masks.
- **Node** dock → **Groups**: add the root to a group called `bunkers`. In chapter 7, the game restores every bunker at the start of a wave with one call to the group.

The rectangle covers the whole bunker, including its empty corners and the arch underneath. It only tells us that a shot is *near* the bunker; the pixels decide whether it actually hit.

## Textures and Images

Godot has two kinds of picture, and the difference matters here:

| Type | Lives in | Good for |
| --- | --- | --- |
| `Texture2D` | GPU memory | Drawing, fast. You can't change its pixels. |
| `Image` | Regular memory | Reading and writing individual pixels. Can't be drawn directly. |

An `ImageTexture` bridges the two: it uploads an `Image` to the GPU, and `update()` uploads it again after you've changed the pixels. So each bunker keeps an `Image` to edit and an `ImageTexture` to show it.

## The script

```gdscript title="bunker.gd"
extends Area2D
## A destructible shield. Hits erase pixels from the bunker's own copy of its image.

var _image: Image
var _texture: ImageTexture

@onready var sprite: Sprite2D = $Sprite2D
@onready var original: Texture2D = sprite.texture


func _ready() -> void:
	reset()


## Restore the undamaged bunker. Called at the start of every wave.
func reset() -> void:
	# get_image() may return the image the renderer keeps for the original texture,
	# shared by every bunker. Copy it, so each bunker damages only its own pixels.
	_image = Image.new()
	_image.copy_from(original.get_image())
	_texture = ImageTexture.create_from_image(_image)
	sprite.texture = _texture
```

- `original` remembers the imported `bunker.png`. `@onready` variables are filled in order, so `sprite` already exists when `original` reads its texture.
- `reset()` builds a fresh image and texture from the original. Since the sprite now shows *our* texture, damaging `_image` will change what's on screen.

:::danger[Copy the image]
It's tempting to write `_image = original.get_image()`. Don't. Depending on the renderer, `get_image()` can hand you the very `Image` the engine keeps for that texture, *shared* by every bunker. Damage one bunker and all four lose the same pixels, and `reset()` "restores" the damaged picture. `copy_from` guarantees each bunker edits a private copy. (This tutorial's game had exactly that bug until the test run caught it.)
:::

## Four bunkers

In `game.tscn`, add a `Node2D` named `Bunkers` and instance `bunker.tscn` under it four times:

| Node | Position |
| --- | --- |
| `Bunker1` | (128, 272) |
| `Bunker2` | (256, 272) |
| `Bunker3` | (384, 272) |
| `Bunker4` | (512, 272) |

That's the screen width split into fifths. The bunkers sit between the formation and your cannon, and nothing hits them yet: shots fly straight through, because no bunker has a `hit` method.

```quiz
question: You want to change a single pixel of a picture at runtime. Which type do you edit?
options:
  - Texture2D
  - Image
  - Sprite2D
answer: 1
explain: An Image holds pixels in regular memory, where you can read and write them. Textures live on the GPU, ready to draw.
```
