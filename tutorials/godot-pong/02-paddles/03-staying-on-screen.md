---
title: Staying on screen
estimatedMinutes: 5
---

Without limits, a paddle happily drives off the top of the screen. Clamp its position after moving:

```gdscript title="paddle.gd" ins={1,11}
const HALF_HEIGHT := 24.0

@export var speed := 400.0
@export var up_action := &"p1_up"
@export var down_action := &"p1_down"

func _physics_process(_delta: float) -> void:
	var direction := Input.get_axis(up_action, down_action)
	velocity = Vector2(0, direction * speed)
	move_and_slide()
	position.y = clampf(position.y, HALF_HEIGHT, get_viewport_rect().size.y - HALF_HEIGHT)
```

`get_viewport_rect().size` is the 640×360 viewport, so the paddle's centre stays between 24 and 336.

:::danger
Don't set `position` *before* `move_and_slide()`: the physics step would immediately overwrite it.
:::

```quiz
question: Why is `HALF_HEIGHT` 24?
options:
  - It's the viewport height divided by 15
  - It's half of the paddle's 48px height
  - Godot requires a margin of 24px
answer: 1
explain: A node's `position` is its centre, so the centre may come no closer than half a paddle to the edge.
```
