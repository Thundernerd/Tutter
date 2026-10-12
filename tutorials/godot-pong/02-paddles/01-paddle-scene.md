---
title: The paddle scene
estimatedMinutes: 15
---

## Nodes

A paddle is a `CharacterBody2D` with a `CollisionShape2D` and a `ColorRect` for visuals:

```text
Paddle (CharacterBody2D)
├── CollisionShape2D   # RectangleShape2D, 8×48
└── ColorRect          # same size, centred
```

## Moving with input

Attach a script to `Paddle`:

```gdscript title="paddle.gd" {4,9}
extends CharacterBody2D

@export var speed := 400.0
@export var up_action := "p1_up"
@export var down_action := "p1_down"

func _physics_process(_delta: float) -> void:
    var direction := Input.get_axis(up_action, down_action)
    velocity = Vector2(0, direction * speed)
    move_and_slide()
```

:::note
`Input.get_axis` returns a value between -1 and 1, so diagonal-free keyboard input "just works".
:::

The same code in C#, if you are using the .NET build:

```csharp title="Paddle.cs"
public partial class Paddle : CharacterBody2D
{
    [Export] public float Speed = 400f;

    public override void _PhysicsProcess(double delta)
    {
        var direction = Input.GetAxis("p1_up", "p1_down");
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
