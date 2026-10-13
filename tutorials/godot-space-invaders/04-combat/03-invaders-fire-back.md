---
title: Invaders fire back
description: The same shot script pointing down, the bottom invader of each column, and a player that can be hit.
estimatedMinutes: 25
---

## The invader shot

New scene, `Area2D` root named `InvaderShot`:

```text
InvaderShot (Area2D)        # script: shot.gd, Speed 150
├── CollisionShape2D        # RectangleShape2D, 6×14
└── AnimatedSprite2D        # bomb_1.png and bomb_2.png, 10 FPS, autoplay on
```

- Attach the **existing** `shot.gd` (drag it onto the root), then set **Speed** to `150` in the Inspector. Positive means down. Same script, different scene.
- In the SpriteFrames panel, add the two bomb frames to `default`, set the speed to `10` FPS and click the **Autoplay on Load** button. The zig-zag wiggles as it falls.
- Collision: **Layer** `invader_shots`, **Mask** `player` and `bunkers`.
- **Node** dock → **Groups**: add the root to a group called `invader_shots`. The formation counts the members of this group to limit how many shots fly at once.

Save as `invader_shot.tscn`.

## Who gets to shoot?

In the arcade, only the **lowest invader in each column** fires. Otherwise invaders would shoot their own friends in the back. The formation finds those invaders by grouping the survivors by `column`, the variable we set while building.

Add a second timer under `Formation`, named `ShootTimer`: **Wait Time** `1`, not one-shot, not autostart. Connect its `timeout` to `Formation`. Then extend `formation.gd`:

```gdscript title="formation.gd" ins={2}
const INVADER_SCENE := preload("res://invader.tscn")
const SHOT_SCENE := preload("res://invader_shot.tscn")
```

```gdscript title="formation.gd" ins={5-8,13,16}
## Seconds between steps with a full formation...
@export var slowest_step := 0.6
## ...and with a single invader left.
@export var fastest_step := 0.03
## Most invader shots allowed on screen at once.
@export var max_shots := 3
## The player. Every third shot comes from the column closest to it.
@export var target: Node2D

var _invaders: Array[Invader] = []
var _total := 0
var _direction := 1.0
var _shots_fired := 0

@onready var step_timer: Timer = $StepTimer
@onready var shoot_timer: Timer = $ShootTimer
```

```gdscript title="formation.gd" ins={3,8}
func start() -> void:
	step_timer.start()
	shoot_timer.start()


func stop() -> void:
	step_timer.stop()
	shoot_timer.stop()
```

And the shooting itself:

```gdscript title="formation.gd"
func _on_shoot_timer_timeout() -> void:
	shoot_timer.wait_time = randf_range(0.4, 1.2)
	if get_tree().get_nodes_in_group("invader_shots").size() >= max_shots:
		return
	var shooters := _bottom_invaders()
	if shooters.is_empty():
		return
	var shooter: Invader = shooters.pick_random()
	_shots_fired += 1
	if target and _shots_fired % 3 == 0:
		shooter = _closest_to_target(shooters)
	var shot: Area2D = SHOT_SCENE.instantiate()
	shot.position = shooter.global_position + Vector2(0, 12)
	add_sibling(shot) # Not a child: shots must not march along with the formation.


## The lowest invader in every column. Only these have a clear line of fire.
func _bottom_invaders() -> Array:
	var lowest := {} # column -> invader
	for invader in _invaders:
		var current: Invader = lowest.get(invader.column)
		if current == null or invader.position.y > current.position.y:
			lowest[invader.column] = invader
	return lowest.values()


func _closest_to_target(shooters: Array) -> Invader:
	var best: Invader = shooters[0]
	for invader: Invader in shooters:
		if absf(invader.global_position.x - target.global_position.x) < absf(best.global_position.x - target.global_position.x):
			best = invader
	return best
```

- **A random rhythm.** Each time the timer fires, it picks a new wait between 0.4 and 1.2 seconds for next time, so the shots don't arrive like clockwork.
- **A shot limit.** With three shots already falling, the formation holds its fire. Groups make the count a one-liner.
- **`_bottom_invaders`** keeps a dictionary from column number to the lowest invader seen so far in that column. `lowest.get(column)` returns `null` for a column we haven't seen yet. What's left at the end is exactly one shooter per column that still has invaders.
- **Aimed shots.** Every third shot comes from the column nearest the player instead of a random one. The arcade did the same, which is why standing still is a bad idea.

Finally, select `Formation` in `game.tscn` and drag the `Player` node into its **Target** slot in the Inspector. An exported `Node2D` variable becomes a node picker.

## The player can be hit

Add an `AnimatedSprite2D` named `Explosion` to `player.tscn`: a `default` animation with `player_explosion_1.png` and `player_explosion_2.png` at 8 FPS, looping, and the node's **Visible** turned off. Then update `player.gd`:

```gdscript title="player.gd" ins={4,13,15-16,20-21,36-42,45-49}
extends Area2D
## The player's laser cannon. Moves along the bottom and fires one shot at a time.

signal died

const SHOT_SCENE := preload("res://player_shot.tscn")
## How close the ship's centre may get to the screen edge.
const MARGIN := 20.0

@export var speed := 160.0

var _shot_in_flight: Area2D
var _alive := true

@onready var ship: Sprite2D = $Ship
@onready var explosion: AnimatedSprite2D = $Explosion


func _physics_process(delta: float) -> void:
	if not _alive:
		return
	var direction := Input.get_axis("move_left", "move_right")
	position.x += direction * speed * delta
	position.x = clampf(position.x, MARGIN, get_viewport_rect().size.x - MARGIN)
	# Like the arcade: no new shot until the last one is gone.
	if Input.is_action_just_pressed("shoot") and not is_instance_valid(_shot_in_flight):
		_shoot()


func _shoot() -> void:
	_shot_in_flight = SHOT_SCENE.instantiate()
	_shot_in_flight.position = position + Vector2(0, -12)
	add_sibling(_shot_in_flight)


## Called by an invader shot that touches the ship.
func hit(_shot: Area2D) -> bool:
	if not _alive:
		return false
	explode()
	died.emit()
	return true


func explode() -> void:
	_alive = false
	ship.hide()
	explosion.show()
	explosion.play()
```

`hit` and `explode` are separate on purpose: in chapter 7, invaders that reach the ground blow up the ship without it being "hit" by anything.

For now, losing means the formation stops. Connect the player's `died` signal to `Game`:

```gdscript title="game.gd"
func _on_player_died() -> void:
	formation.stop()
```

Run it. The invaders rain zig-zags on you; your shot can knock them out of the air; and if one gets through, your cannon bursts and the invasion halts. Lives come in chapter 7.

```quiz
type: multiple
question: Columns 0 and 1 still have invaders in rows 0–4; column 2 only has its row 0 squid left. Which invaders can fire?
options:
  - Column 0, row 4
  - Column 0, row 3
  - Column 1, row 4
  - Column 2, row 0
answer: [0, 2, 3]
explain: Each column fires from its lowest surviving invader. In column 2 that's the squid at the top, with nothing below it.
```

```quiz
question: Both shot scenes use `shot.gd`. What makes the invader shot fall instead of rise?
options:
  - A second script that inherits from shot.gd
  - Its `speed` is overridden to 150 (positive, so down) in the invader shot scene
  - The AnimatedSprite2D
answer: 1
```
