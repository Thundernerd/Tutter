---
title: The paddle scene
description: A CharacterBody2D that moves with input.
estimatedMinutes: 15
---

## Nodes

Create a new scene with a `CharacterBody2D` root named `Paddle`, and give it two children:

```text
Paddle (CharacterBody2D)
├── CollisionShape2D   # RectangleShape2D, size 8×48
└── ColorRect          # 8×48, offset so it's centred: left -4, top -24
```

A `CharacterBody2D` is a physics body *you* move from code (as opposed to a `RigidBody2D`, which physics moves for you). The `ColorRect` is just the visuals; the `CollisionShape2D` is what physics sees.

Select `Paddle` and set **Motion Mode** to **Floating** in the Inspector. The default, *Grounded*, is meant for platformers with floors and slopes. Floating is for everything else.

Finally, open the **Node** dock → **Groups**, and add the paddle to a group called `paddles`. The ball will use this later to tell paddles from walls.

Save as `paddle.tscn`.

## Moving with input

Attach a script to `Paddle`:

```gdscript title="paddle.gd"
extends CharacterBody2D

@export var speed := 400.0
@export var up_action := &"p1_up"
@export var down_action := &"p1_down"


func _physics_process(_delta: float) -> void:
	var direction := Input.get_axis(up_action, down_action)
	velocity = Vector2(0, direction * speed)
	move_and_slide()
```

- `@export` shows a variable in the Inspector, so each paddle instance can use different actions.
- `&"p1_up"` is a **StringName**: a string Godot interns for fast comparisons. Input actions are StringNames internally.
- `_physics_process` runs at a fixed 60 ticks per second, which is where movement belongs.
- `move_and_slide()` moves by `velocity` (in pixels per *second*; it multiplies by delta for you).

:::note
We're not using `delta` here because `move_and_slide()` already does. The leading underscore in `_delta` tells Godot the unused parameter is intentional.
:::

The same code in C#, if you are using the .NET build:

```csharp title="Paddle.cs"
public partial class Paddle : CharacterBody2D
{
	[Export] public float Speed = 400f;
	[Export] public StringName UpAction = "p1_up";
	[Export] public StringName DownAction = "p1_down";

	public override void _PhysicsProcess(double delta)
	{
		var direction = Input.GetAxis(UpAction, DownAction);
		Velocity = new Vector2(0, direction * Speed);
		MoveAndSlide();
	}
}
```

```quiz
question: Which method actually moves a `CharacterBody2D` using its `velocity`?
type: text
answer: [move_and_slide, move_and_slide()]
hint: It slides along whatever it collides with.
explain: '`move_and_slide()` moves the body by `velocity` and handles collisions for you.'
```
