---
title: The brick scene
description: A StaticBody2D that the ball can hit and break.
estimatedMinutes: 15
---

## Nodes

Bricks don't move until they're destroyed, so like the walls they're a `StaticBody2D`. New scene, saved as `brick.tscn`:

```text
Brick (StaticBody2D)   # Layer: bricks, Mask: (none)
├── CollisionShape2D   # RectangleShape2D, 46×14
└── ColorRect          # left -23, top -7, right 23, bottom 7, Mouse Filter: Ignore
```

Each brick gets a 48×16 cell in the grid. At 46×14 there's a 2px gap between neighbours, which makes the grid readable, and the ball (8px) is far too big to slip through.

## Taking hits

```gdscript title="brick.gd"
extends StaticBody2D

signal destroyed

@export var hit_points := 1


## Called by the ball when it bounces off this brick.
func hit() -> void:
	hit_points -= 1
	if hit_points <= 0:
		destroyed.emit()
		queue_free()
```

`queue_free()` deletes the brick at the end of the current frame, which is the safe way to remove a node while other code (here, the ball's physics step) may still be looking at it. The `destroyed` signal lets the rest of the game react: scoring, sounds and particles all hang off it later.

## The ball breaks bricks

Add `bricks` to the ball's collision **Mask** (it now has `walls`, `paddle` and `bricks`). Then, after bouncing, tell whatever we hit that it was hit, if it understands that:

```gdscript title="ball.gd" ins={3-6} del={2}
	velocity = velocity.bounce(collision.get_normal())
	hit_wall.emit()
	if collider.has_method("hit"):
		collider.hit()
	else:
		hit_wall.emit()
```

`has_method("hit")` is **duck typing**: the ball doesn't check "is this a brick?", it checks "can this be hit?". Anything with a `hit()` method will work, today or after you invent a new kind of target.

## Try it

Instance `brick.tscn` a few times in `game.tscn`, anywhere between y = 50 and y = 200, and play. Each brick vanishes on contact while the ball bounces off it. Set **Hit Points** to `3` on one of them in the Inspector: that one takes three hits.

Delete the hand-placed bricks when you're done. The next two pages generate them.

```quiz
question: Why does the brick call `queue_free()` instead of `free()`?
options:
  - queue_free() is faster
  - It waits until the end of the frame, so code still using the brick this frame doesn't crash
  - free() only works on Control nodes
answer: 1
explain: The ball is in the middle of its physics step when it calls `hit()`. Freeing the brick immediately would pull it out from under that code.
```

```quiz
question: The ball hits a wall, which has no `hit()` method. What happens?
options:
  - The game crashes
  - The ball bounces and emits hit_wall
  - The wall is destroyed
answer: 1
```
