---
title: Ball and launch
description: A ball scene spawned from code that waits on the paddle until you launch it.
estimatedMinutes: 20
---

## The ball scene

New scene, `CharacterBody2D` root named `Ball`, saved as `ball.tscn`:

```text
Ball (CharacterBody2D)   # Motion Mode: Floating
├── CollisionShape2D     # RectangleShape2D, 8×8
└── ColorRect            # left -4, top -4, right 4, bottom 4, Mouse Filter: Ignore
```

Collision: **Layer** `ball`; **Mask** `walls` and `paddle`. Balls don't collide with each other, which will matter when there are three of them.

Unlike the paddle, **don't** put the ball in `game.tscn`. You lose balls, get new ones after losing a life, and a power-up splits one into three, so the game creates them from code instead.

## Waiting on the paddle

A new ball sits on the paddle and follows it until the player launches it. Attach this script:

```gdscript title="ball.gd"
extends CharacterBody2D

@export var start_speed := 240.0

var speed := 0.0
## While set, the ball rides on this paddle, waiting to be launched.
var held_by: Node2D


func _physics_process(delta: float) -> void:
	if held_by:
		global_position = held_by.global_position + Vector2(0, -10)
		return
	move_and_collide(velocity * delta)


## Leave the paddle, heading up at a slightly random angle.
func launch() -> void:
	if held_by == null:
		return
	held_by = null
	speed = start_speed
	velocity = Vector2.UP.rotated(deg_to_rad(randf_range(-30.0, 30.0))) * speed
```

- `held_by` is either the paddle or `null`. `if held_by:` is true when it's set.
- 10px above the paddle's centre: 4 (half the paddle) + 4 (half the ball) + 2 to spare.
- `move_and_collide` moves by the vector you give it, so here we multiply by `delta` ourselves. It returns information about what was hit, which we'll use on the next page.
- `launch()` returns early when the ball isn't held, so calling it on a ball that's already flying is harmless.

### Directions with `rotated`

`Vector2.UP` is `(0, -1)`, a vector of length 1 pointing up (y grows *downwards* in Godot 2D). `rotated(angle)` turns it clockwise by an angle in radians, and `deg_to_rad` converts from degrees. So the ball leaves somewhere between 30° left and 30° right of straight up. Multiplying a length-1 vector by `speed` gives a velocity of exactly that speed, whatever the angle.

## Spawning from code

Add a plain `Node2D` named `Balls` to `game.tscn`. It's a container, so the game can find every ball with `balls.get_children()`. Then give `Game` a script:

```gdscript title="game.gd"
extends Node2D

const BALL_SCENE := preload("res://ball.tscn")

@onready var paddle: CharacterBody2D = $Paddle
@onready var balls: Node2D = $Balls


func _ready() -> void:
	var ball := _spawn_ball()
	ball.held_by = paddle


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("launch"):
		for ball in balls.get_children():
			ball.launch()


func _spawn_ball() -> CharacterBody2D:
	var ball: CharacterBody2D = BALL_SCENE.instantiate()
	balls.add_child(ball)
	return ball
```

- `preload` loads the scene file once, when the script loads. `instantiate()` builds a fresh copy of its nodes, and `add_child` puts that copy into the running game. That's all "spawning" is.
- `@onready` fills in `paddle` and `balls` just before `_ready()`, once the child nodes exist. `$Paddle` is short for `get_node("Paddle")`.
- `_unhandled_input` gets the launch event, whether it came from <kbd>Space</kbd> or a mouse click.

Run it: the ball rides on the paddle until you press <kbd>Space</kbd> or click. Then it flies off, stops dead at the first thing it touches, and stays there. Bouncing is next.

```quiz
question: Which vector does `Vector2.UP.rotated(deg_to_rad(90))` give (approximately)?
options:
  - (0, -1), still up
  - (1, 0), right
  - (-1, 0), left
  - (0, 1), down
answer: 1
explain: Positive angles turn clockwise on screen, because y points down. A quarter turn clockwise from up is right.
```

```quiz
question: What does `instantiate()` return?
options:
  - The PackedScene itself
  - A new copy of the scene's root node, with all its children, not yet in the tree
  - A node that is already added to the current scene
answer: 1
explain: The copy only becomes part of the game once you call `add_child` on a node that is in the tree.
```
