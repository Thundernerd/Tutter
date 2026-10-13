---
title: Mouse control
description: Following the mouse with velocity, so physics still works.
estimatedMinutes: 10
---

Breakout was made for a dial, and a mouse is the closest thing most of us have. With the mouse, the paddle should be wherever the pointer is.

## Teleporting vs. moving

The obvious code is `position.x = get_global_mouse_position().x`. It works, but it *teleports* the paddle: physics never sees it move, the walls can't stop it, and it can jump straight through the ball.

Instead, work out the velocity that covers the distance to the mouse in exactly one physics tick, and let `move_and_slide()` do the moving as before:

```gdscript title="paddle.gd" ins={2-3,10-15} del={8-9}
@export var speed := 420.0
## Follow the mouse instead of the keyboard. This becomes a setting in the options chapter.
@export var use_mouse := true

var width := NORMAL_WIDTH


func _physics_process(_delta: float) -> void:
	velocity.x = Input.get_axis(&"move_left", &"move_right") * speed
func _physics_process(delta: float) -> void:
	if use_mouse:
		# Cover the distance to the mouse in exactly one physics tick.
		velocity.x = (get_global_mouse_position().x - global_position.x) / delta
	else:
		velocity.x = Input.get_axis(&"move_left", &"move_right") * speed
	move_and_slide()
	var half_width := width / 2
	position.x = clampf(position.x, WALL + half_width, get_viewport_rect().size.x - WALL - half_width)
```

- `get_global_mouse_position()` is the mouse in game coordinates, already scaled from window pixels to our 640×360 world. You never have to deal with the stretch factor yourself.
- `delta` is the length of one physics tick (1/60 s). Distance divided by time is velocity, so this velocity arrives at the mouse in exactly one tick.
- The parameter is now `delta` without the underscore, because we use it.

Run it. The paddle sticks to the pointer, still stops at the walls, and still respects the clamp when the pointer leaves the window.

:::note[Hiding the cursor]
The arrow on top of the paddle is distracting. We'll hide it during play once control schemes become a setting, because the menus still need it.
:::

Set **Use Mouse** to off in the Inspector of the paddle instance and you're back on the keyboard.

```quiz
question: The mouse is 30px right of the paddle. At 60 physics ticks per second, what is `velocity.x`?
type: text
answer: ["1800", "1800.0", "1800px/s", "1800 px/s"]
hint: 'Distance divided by `delta`, which is 1/60.'
explain: 30 ÷ (1/60) = 30 × 60 = 1800 pixels per second, for one tick.
```

```quiz
question: Why not simply set `position.x` to the mouse position?
options:
  - It's slower
  - Teleporting skips physics, so the walls can't stop the paddle and the ball can end up inside it
  - get_global_mouse_position() can't be used in _physics_process
answer: 1
```
