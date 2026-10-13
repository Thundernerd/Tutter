---
title: The ghost scene
description: One white ghost sprite tinted four colours, with eyes that look where it's going.
estimatedMinutes: 20
---

## Body and eyes

A ghost is drawn in two parts:

- the **body**, which wobbles (two frames) and has a colour, and
- the **eyes**, which look in the direction the ghost is moving.

Splitting them pays off twice. One white body picture can be tinted into all four ghost colours. And when a ghost gets eaten (chapter 6), we hide the body and only the eyes float back home.

Create a new scene with a `Node2D` root named `Ghost`, saved as `ghost.tscn`:

```text
Ghost (Node2D)            # in group "ghosts"
├── Body (AnimatedSprite2D)
└── Eyes (Sprite2D)       # texture ghost_eyes.png, Hframes 4, Frame 2
```

Give `Body` a new **SpriteFrames** with three animations, all from `art/ghost.png` (a 6×1 sprite sheet):

| Animation | Frames | Speed | Used when |
| --- | --- | --- | --- |
| `normal` | 0, 1 | 6 FPS | chasing or scattering |
| `frightened` | 2, 3 | 6 FPS | blue and running away (chapter 6) |
| `flashing` | 2, 3, 4, 5 | 8 FPS | frightened, but about to recover (chapter 10) |

`Eyes` is a plain `Sprite2D`. With **Hframes** set to 4, Godot cuts `ghost_eyes.png` into four frames and shows the one in **Frame**: 0 looks right, 1 down, 2 left, 3 up.

Finally, select `Ghost`, open the **Node** dock → **Groups**, and add it to a group named `ghosts`. A debug overlay will use the group to find every ghost.

## The script

Attach a script to `Ghost` that extends `Actor`:

```gdscript title="ghost.gd"
class_name Ghost
extends Actor
## A ghost. The four ghosts share this script; each one extends it to choose
## its own target in chase mode.

## When two directions are equally good, the first one in this list wins.
const DIRECTIONS: Array[Vector2i] = [Vector2i.UP, Vector2i.LEFT, Vector2i.DOWN, Vector2i.RIGHT]
## Frames in ghost_eyes.png for each direction.
const EYE_FRAMES := {Vector2i.RIGHT: 0, Vector2i.DOWN: 1, Vector2i.LEFT: 2, Vector2i.UP: 3}

@export var color := Color.RED
@export var player: Player

@export_group("Speeds")
@export var speed := 67.5

@onready var start_position := position
@onready var body: AnimatedSprite2D = $Body
@onready var eyes: Sprite2D = $Eyes


func _ready() -> void:
	reset()


func reset() -> void:
	position = start_position
	direction = Vector2i.LEFT
	_update_sprite()


func _update_sprite() -> void:
	eyes.frame = EYE_FRAMES.get(direction, eyes.frame)
	body.self_modulate = color
	body.play(&"normal")
```

- **`self_modulate`** tints a node without tinting its children, unlike `modulate`. `Eyes` is a sibling of `Body` here, so either would work today, but `self_modulate` says what we mean (colour *this* sprite only) and keeps working if you ever move the eyes under the body.
- **`EYE_FRAMES.get(direction, eyes.frame)`** looks up the frame for the current direction. When the direction isn't in the dictionary (`ZERO`), it keeps the current frame instead of failing.
- **`@export_group("Speeds")`** folds the exports below it into a collapsible group in the Inspector. We'll add more speeds in chapter 6.
- **`DIRECTIONS`** is in a specific order on purpose; the next page explains why.

## The first ghost

In `game.tscn`, add a `Node2D` named `Ghosts` under `World` (after `Player`, so ghosts are drawn on top of the player), and instance `ghost.tscn` in it. Name the instance `Ember`, and set:

| Property | Value |
| --- | --- |
| Position | (140, 115) |
| Color | `#ff2619` (red) |
| Maze | the `Maze` node |
| Player | the `Player` node |

`(140, 115)` is the spot just above the ghost house door: `Maze.house_exit` from chapter 2. Run the game and Ember sits there, red, looking left. Time to make it move.

```quiz
question: Why are the ghost's body and eyes separate sprites?
type: multiple
options:
  - One white body can be tinted to any colour, without tinting the eyes
  - The eyes can show the direction independently of the body animation
  - An eaten ghost can hide its body and keep its eyes
  - Godot can't animate a sprite with more than two frames
answer: [0, 1, 2]
```
