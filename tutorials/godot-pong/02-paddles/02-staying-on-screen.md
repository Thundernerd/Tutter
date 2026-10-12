---
title: Staying on screen
estimatedMinutes: 10
---

Without limits, a paddle happily drives off the top of the screen. Clamp its position after moving:

```gdscript title="paddle.gd" ins={5-6}
func _physics_process(_delta: float) -> void:
    var direction := Input.get_axis(up_action, down_action)
    velocity = Vector2(0, direction * speed)
    move_and_slide()
    var half := 24.0
    position.y = clamp(position.y, half, get_viewport_rect().size.y - half)
```

:::danger
Don't set `position` *before* `move_and_slide()`: the physics step would immediately overwrite it.
:::

```quiz
question: Why is `half` 24 in the snippet above?
options:
  - It's the viewport height divided by 15
  - It's half of the paddle's 48px height
  - Godot requires a margin of 24px
answer: 1
```
