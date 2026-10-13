---
title: The ship
description: An Area2D that moves with input and stays on screen.
estimatedMinutes: 15
---

## Nodes

Create a new scene with an `Area2D` root named `Player`, and give it two children:

```text
Player (Area2D)
├── CollisionShape2D   # RectangleShape2D, size 26×16
└── Ship (Sprite2D)    # texture: sprites/player.png
```

Drag `player.png` from the FileSystem dock onto the Sprite2D's **Texture** slot. A `Sprite2D` is centred on its node by default, and so is the collision rectangle, so the node's `position` is the middle of the ship.

The `CollisionShape2D` is what the physics engine sees. The ship doesn't need it yet, but invader shots will look for it in chapter 4.

:::note[Area2D vs CharacterBody2D]
A `CharacterBody2D` is for things that collide *solidly*: it stops at walls and slides along floors. An `Area2D` never stops anything. It only reports "something entered me" or "these things overlap me". That's exactly what a shooter needs, and it's also cheaper.
:::

Save the scene as `player.tscn`.

## Moving

Attach a script to `Player`:

```gdscript title="player.gd"
extends Area2D
## The player's laser cannon. Moves along the bottom and fires one shot at a time.

## How close the ship's centre may get to the screen edge.
const MARGIN := 20.0

@export var speed := 160.0


func _physics_process(delta: float) -> void:
	var direction := Input.get_axis("move_left", "move_right")
	position.x += direction * speed * delta
	position.x = clampf(position.x, MARGIN, get_viewport_rect().size.x - MARGIN)
```

- `_physics_process` runs at a fixed 60 ticks per second, which is where movement belongs.
- `speed` is in pixels per *second*. Multiplying by `delta` (the seconds since the last tick, 1/60) turns it into pixels for *this* tick, so the ship moves at the same speed on every computer.
- `clampf` keeps the ship's centre between 20 and 620. The ship is 26 pixels wide, so that leaves a few pixels of breathing room at each edge.
- `@export` shows `speed` in the Inspector, handy for tuning while the game runs.
- `##` comments are **documentation comments**: Godot shows them as tooltips in the Inspector and in the built-in help.

:::tip
Area2D has no `move_and_slide()`: we set `position` directly. That's fine for anything that doesn't need to stop at walls.
:::

## Into the game

Open `game.tscn`, drag `player.tscn` from the FileSystem dock onto `Game`, and set the instance's position to **(320, 316)**.

Add a `ColorRect` named `Ground` under `Game` too: position (0, 334), size 640×2, colour green (`#50e66e`). It's the line the invaders must never reach.

Run the game: <kbd>←</kbd> and <kbd>→</kbd> slide the cannon along the ground, and it stops at the edges.

```quiz
question: Why multiply `speed` by `delta`?
options:
  - It makes the ship accelerate smoothly
  - It converts pixels per second into pixels for this one tick
  - Godot requires it for Area2D nodes
answer: 1
explain: '`delta` is the time since the last tick in seconds. 160 px/s × 1/60 s ≈ 2.7 px per tick, whatever the frame rate.'
```
