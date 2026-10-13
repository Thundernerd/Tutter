---
title: The paddle scene
description: A CharacterBody2D that moves left and right.
estimatedMinutes: 15
---

## Nodes

Create a new scene with a `CharacterBody2D` root called `Paddle`, and give it two children:

```text
Paddle (CharacterBody2D)   # Motion Mode: Floating
├── CollisionShape2D       # RectangleShape2D, size 64×8
└── ColorRect              # left -32, top -4, right 32, bottom 4
```

A **CharacterBody2D** is a physics body that your code moves. Physics won't push it around, but it does stop it at walls. The `CollisionShape2D` is what physics sees; the `ColorRect` is what you see. The offsets centre the rectangle on the body's origin, so `position` is the middle of the paddle.

On the `Paddle`, set **Motion Mode** to **Floating**. The default, *Grounded*, has ideas about floors, slopes and gravity that suit platformers. Floating means "just move where I say". Give the `ColorRect` an off-white colour, like `#ebf0ff`.

Two more settings:

- In the **Node** dock → **Groups**, add the paddle to a group named `paddle`. The ball will use it to recognise the paddle.
- On the `ColorRect`, set **Mouse → Filter** to **Ignore**.

:::warning[Why ignore the mouse?]
`ColorRect` is a UI control, and controls catch mouse clicks by default (filter **Stop**). A click that lands on the paddle's rectangle would be used up by the rectangle and never reach our launch code: with **Stop**, clicking on the paddle doesn't launch the ball. Every `ColorRect` that's part of the game world (paddle, ball, bricks, walls) gets **Ignore**.
:::

Save the scene as `paddle.tscn`.

## Moving with the keyboard

Attach a script to `Paddle`:

```gdscript title="paddle.gd"
extends CharacterBody2D

@export var speed := 420.0


func _physics_process(_delta: float) -> void:
	velocity.x = Input.get_axis(&"move_left", &"move_right") * speed
	move_and_slide()
```

- `@export` puts `speed` in the Inspector, so you can tweak it without opening the script.
- `&"move_left"` is a **StringName**, a string Godot stores once and compares quickly. Action names are StringNames internally. A plain `"move_left"` works too, it just gets converted.
- `_physics_process` runs 60 times per second at a steady rate, which keeps movement smooth and predictable.
- `velocity` is in pixels per **second**. `move_and_slide()` moves the body by `velocity` × the frame time, stopping at anything solid.

The underscore in `_delta` tells Godot "I know I'm not using this parameter".

## Put it in the game

Open `game.tscn`, drag `paddle.tscn` from the FileSystem dock onto `Game`, and set the instance's **Position** to `(320, 336)`: centred, near the bottom. Press <kbd>F5</kbd> and steer with the arrow keys.

The paddle can drive straight off the screen. Walls are next.

```quiz
question: What does `Input.get_axis(&"move_left", &"move_right")` return while you hold both arrow keys?
options:
  - "-1"
  - "0"
  - "1"
answer: 1
explain: The two sides cancel out. That's also why one call is enough to read both directions.
```

```quiz
question: Which property of a `CharacterBody2D` does `move_and_slide()` read to know how far to move?
type: text
answer: [velocity]
explain: Set `velocity` (pixels per second), then call `move_and_slide()`. It multiplies by the frame time for you.
```
