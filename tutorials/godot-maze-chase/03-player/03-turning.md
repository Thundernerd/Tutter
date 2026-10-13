---
title: Steering and buffered turns
description: Remember the player's last request and turn as soon as the maze allows it.
estimatedMinutes: 20
---

## Why buffer?

The simplest controls would be "turn when the key is pressed". In a maze that feels awful: to turn into a side corridor you'd have to press the key at the exact frame the player passes the junction. Press a moment early and nothing happens.

Maze games solve this with a **buffered direction**. A key press only says *where you want to go next*. The game remembers it and turns at the first tile centre where that direction is open. You can press "up" well before the junction, and the player turns the moment it gets there. This "pre-turning" is a big part of why the classics feel responsive.

Two more rules make it feel right:

- **Turning around** is allowed anywhere, even between tile centres: the corridor behind you is always open.
- If the way ahead is blocked and you haven't asked for anything else, the player **stops** at the centre and waits.

## The code

Update `player.gd`:

```gdscript title="player.gd" ins={4-9,13-16,29-30,32,36-42,44,48-50,54-60}
class_name Player
extends Actor

const INPUT_DIRECTIONS := {
	&"move_up": Vector2i.UP,
	&"move_down": Vector2i.DOWN,
	&"move_left": Vector2i.LEFT,
	&"move_right": Vector2i.RIGHT,
}

@export var speed := 72.0

## The direction the player asked for. We turn as soon as the maze allows it.
var next_direction := Vector2i.LEFT
## The last direction moved in. The ghosts use it, even while we stand still.
var facing := Vector2i.LEFT

@onready var start_position := position
@onready var sprite: AnimatedSprite2D = $Sprite


func _ready() -> void:
	reset()


func reset() -> void:
	position = start_position
	direction = Vector2i.LEFT
	next_direction = Vector2i.LEFT
	facing = Vector2i.LEFT
	sprite.play(&"move")
	_update_sprite()


func _physics_process(delta: float) -> void:
	for action in INPUT_DIRECTIONS:
		if Input.is_action_just_pressed(action):
			next_direction = INPUT_DIRECTIONS[action]
	if next_direction == -direction:
		direction = next_direction # Turning around is allowed anywhere.
	elif direction == Vector2i.ZERO and maze.is_open(cell + next_direction):
		direction = next_direction # Start moving again after a stop.
	move_on_grid(speed * delta)
	_update_sprite()


func _on_tile_center() -> void:
	if maze.is_open(cell + next_direction):
		direction = next_direction
	elif not maze.is_open(cell + direction):
		direction = Vector2i.ZERO # Hit a wall: wait here.


func _update_sprite() -> void:
	if direction != Vector2i.ZERO:
		facing = direction
		sprite.play()
	else:
		sprite.pause()
	sprite.rotation = Vector2(facing).angle()
```

### Reading the input

`INPUT_DIRECTIONS` maps each action to a direction, so one loop handles all four keys. A press only updates `next_direction`; it doesn't move anything by itself.

### Deciding

There are three places where the player's direction can change:

| Where | Rule |
| --- | --- |
| Every frame | If you asked for the opposite direction, turn around right away. |
| Every frame | If standing still and the asked-for direction is open, start moving. |
| At each tile centre | Turn if the asked-for direction is open. Otherwise keep going, or stop if there's a wall ahead. |

Note that `next_direction` is never cleared. If you press "up" while in a long horizontal corridor, the player turns up at the *first* junction where up is open, which might be a while later. That's the buffer.

### The sprite

The sprite sheet faces right. `Vector2(facing).angle()` is the angle of the facing direction in radians (0 for right, π/2 for down, π for left, -π/2 for up), so rotating the sprite by it makes the mouth point the right way. While standing still, `pause()` freezes the chomping.

`facing` keeps the last real direction. `direction` becomes `ZERO` when the player stops, but a stopped player still faces somewhere, and two of the ghosts will need to know where.

:::tip[Going further: cornering]
In the arcade original, the player could also *cut corners*: a turn requested just before a junction started a few pixels early, moving diagonally for a moment. It made the player slightly faster than the ghosts through turns. It's a fun extension once the game works: start the turn when the actor is within a couple of pixels of the centre.
:::

Run the game. Steer with the arrow keys, try pressing a direction early before a junction, and turn around in the middle of a corridor. Walk into the tunnel on row 14 and come out the other side.

```quiz
question: The player moves right along a corridor. You press Up once. There's no opening upwards for 5 tiles. What happens?
options:
  - Nothing; the press is forgotten
  - The player stops and waits for the opening
  - The player keeps moving right and turns up at the first open junction
answer: 2
explain: '`next_direction` stays "up" until it can be used (or you press something else).'
```

```quiz
question: Why is turning around allowed between tile centres, but other turns only at centres?
options:
  - The cell behind you is always open, so reversing can't put you in a wall
  - Reversing is slower
  - Godot can only rotate sprites by 180° mid-tile
answer: 0
```
