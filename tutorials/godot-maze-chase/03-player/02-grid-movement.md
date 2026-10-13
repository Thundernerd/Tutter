---
title: Moving on the grid
description: Move from tile centre to tile centre, without ever skipping one.
estimatedMinutes: 20
---

## The idea

Every frame, an actor moves `speed × delta` pixels. Along the way it may pass a tile centre, and **every centre is a decision point**: the player turns there if you asked to, a ghost picks a new direction there. The movement code's job is to never skip a centre, even when the actor moves several pixels in one frame.

So instead of `position += velocity * delta`, the actor walks towards the next centre. If it gets there with distance to spare, it stops on the centre, decides, and carries on with what's left:

```text
distance this frame: ├──────────────┤
                     you    centre        next centre
                      ●───────┼───────────────┼
                      ├───────┤ reach it, decide (maybe turn),
                              ├──────┤ then spend the rest
```

## move_on_grid

Add this to `actor.gd`:

```gdscript title="actor.gd"
## Moves `distance` pixels along the grid. Stops at every tile centre on the
## way so the actor can decide where to go next.
func move_on_grid(distance: float) -> void:
	while distance > 0.0 and direction != Vector2i.ZERO:
		var target := maze.next_center(position, direction)
		var to_target := position.distance_to(target)
		if to_target > distance:
			position = position.move_toward(target, distance)
			return
		position = maze.wrap_position(target)
		distance -= to_target
		_on_tile_center()


## Called at every tile centre. Override it to turn, stop or eat.
func _on_tile_center() -> void:
	pass
```

- The `while` loop handles any number of centres per frame. At normal speeds an actor passes one every few frames, but a fast actor (or a hiccup in the frame rate) could pass two at once.
- On arrival the position is set to **exactly** the centre. Tiny floating-point errors never pile up, and `next_center`'s "am I on the centre?" check stays reliable.
- `move_toward` moves along the straight line to the target. Normally that's the same as moving in `direction`, but if an actor ever starts slightly off the grid line (a ghost leaving the house does, as we'll see), it's pulled back onto it.
- `wrap_position` handles the tunnel: arriving at a centre two cells outside the maze teleports the actor to the other side.
- `_on_tile_center()` does nothing here. Scripts that extend `Actor` **override** it with their own version, and `move_on_grid` calls theirs.
- If `_on_tile_center` sets `direction` to `ZERO`, the loop ends: the actor has stopped.

## The player script

Attach a script to `Player` in `player.tscn` that extends `Actor` instead of `Node2D`. A first version that just runs left and stops at walls:

```gdscript title="player.gd"
class_name Player
extends Actor

@export var speed := 72.0

@onready var start_position := position
@onready var sprite: AnimatedSprite2D = $Sprite


func _ready() -> void:
	reset()


func reset() -> void:
	position = start_position
	direction = Vector2i.LEFT
	sprite.play(&"move")


func _physics_process(delta: float) -> void:
	move_on_grid(speed * delta)


func _on_tile_center() -> void:
	if not maze.is_open(cell + direction):
		direction = Vector2i.ZERO # Hit a wall: wait here.
```

`extends Actor` gives the player everything in `actor.gd`: the `maze` export, `direction`, `cell` and `move_on_grid`. `@onready var start_position := position` remembers where the player was placed in the editor, so `reset()` can put it back after losing a life.

Movement happens in `_physics_process`, which runs at a fixed 60 ticks per second. That keeps the game behaving the same on fast and slow computers.

## Add it to the game

Instance `player.tscn` under `World` in `game.tscn`:

```text
Game (Node2D)
└── World (Node2D)       # position (180, 30)
    ├── Maze
    └── Player           # position (140, 225)
```

Select `Player` and click **Assign…** next to **Maze** in the Inspector, then pick the `Maze` node.

The start position `(140, 225)` is the bottom of the maze's centre column, on row 22. `140` is *between* cells 13 and 14 (each cell's centre ends in 5), just like in the arcade original, where the player starts straddling two tiles. That's no problem for `move_on_grid`: moving left from x = 140, the next centre is at x = 135.

Run the game. The player chomps its way left, stops at the first wall, and sits there.

:::note[Speed in pixels per second]
72 px/s is 7.2 tiles per second. In chapter 7 we'll set speeds per level as a fraction of a base speed, the way the arcade games did.
:::

```quiz
question: An actor moving right at x = 3 (cell 0, centre at 5) moves 9 pixels this frame. What happens?
options:
  - It moves to x = 12 and doesn't notice the centre
  - It stops on x = 5, calls `_on_tile_center()`, then moves the remaining 7 pixels if it can
  - It moves to the next centre at x = 15
answer: 1
explain: The loop spends 2 pixels to reach the centre and decides there. Unless `_on_tile_center` stopped it, it then moves the other 7 pixels towards the next centre at x = 15, ending at x = 12.
```

```quiz
question: Why does `move_on_grid` set `position` exactly to the tile centre when it arrives?
options:
  - So rounding errors can't accumulate and the "on the centre" check stays exact
  - Because `_physics_process` requires whole-pixel positions
  - To make the sprite snap to the pixel grid
answer: 0
```
