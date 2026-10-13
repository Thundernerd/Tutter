---
title: Eaten ghosts
description: Catch a frightened ghost, score combo points, and send its eyes home.
estimatedMinutes: 25
---

Touch a frightened ghost and you eat it. Its body vanishes, and its **eyes** race back to the ghost house, where it comes back to life and rejoins the game.

## Eyes going home

Eaten eyes use the same movement rule as always, with a different target: the tile above the door. When they reach it, they walk down into the house (`ENTERING`), revive, and leave again (`LEAVING`).

```gdscript title="ghost.gd"
## Caught by the player while frightened: only the eyes are left, and they go home.
func eat() -> void:
	frightened = false
	state = State.EATEN


## The cell this ghost is heading for right now.
func get_target() -> Vector2i:
	if state == State.EATEN:
		return maze.pos_to_cell(maze.house_exit)
	if chasing:
		return get_chase_target()
	return scatter_target


func _on_tile_center() -> void:
	if state == State.EATEN and position.distance_to(maze.house_exit) <= Maze.TILE / 2.0:
		state = State.ENTERING
		direction = Vector2i.ZERO # Stop grid movement; _walk_to takes over.
		return
	direction = _choose_direction()
```

`house_exit` lies between cells 13 and 14 on row 11, so the eyes arrive at the centre of one of those two cells, 5 pixels away from it. Setting `direction` to `ZERO` ends the `move_on_grid` loop for this frame; from the next frame, `ENTERING` takes over.

Add the `ENTERING` branch to `_physics_process`, an `eyes_speed` to the speeds, and handle both eye states in `_current_speed`:

```gdscript title="ghost.gd" ins={10-12}
func _physics_process(delta: float) -> void:
	var step := _current_speed() * delta
	match state:
		State.IN_HOUSE:
			_bob(step)
		State.LEAVING:
			if _walk_to(maze.house_exit, step):
				state = State.ROAMING
				direction = Vector2i.LEFT
		State.ENTERING:
			if _walk_to(maze.house_center, step):
				state = State.LEAVING # Back to life: head straight out again.
		_:
			move_on_grid(step)
	_update_sprite()
```

```gdscript title="ghost.gd" ins={2,7-8}
@export var fright_speed := 45.0
@export var eyes_speed := 150.0


func _current_speed() -> float:
	match state:
		State.EATEN, State.ENTERING:
			return eyes_speed
		State.IN_HOUSE, State.LEAVING:
			return house_speed
	if maze.is_tunnel(cell):
		return tunnel_speed
	if frightened:
		return fright_speed
	return speed
```

`EATEN` falls through to the `_:` branch of the `match`, so eyes move with `move_on_grid` and the usual rule. At 150 px/s they cross the maze in a couple of seconds.

The body hides while only the eyes are left. Add this as the first line of `_update_sprite`:

```gdscript title="ghost.gd" ins={2}
func _update_sprite() -> void:
	body.visible = state != State.EATEN and state != State.ENTERING
	eyes.visible = not frightened
```

:::note[Eaten in the doorway]
A frightened ghost can also be eaten while it's still `LEAVING`, halfway through the door at x = 140, between two cells. `move_on_grid` then aims for a centre that's 5 pixels to the side. Because it moves with `move_toward` (towards the target point, not just along `direction`), the eyes slide back onto the grid, reach the centre next to the door, and go straight back in. Moving purely along `direction` would never reach that centre, and the eyes would drift up through the walls forever. The headless test for this tutorial caught exactly that bug.
:::

## Points

Eating ghosts during a single power pellet scores **200, 400, 800, 1600**: each catch doubles. A new power pellet resets the combo.

In `game.gd`, the touch check now has two outcomes:

```gdscript title="game.gd"
const GHOST_POINTS := [200, 400, 800, 1600]

var _ghosts_eaten := 0


func _physics_process(_delta: float) -> void:
	for ghost: Ghost in ghosts:
		if ghost.can_touch() and player.position.distance_to(ghost.position) < TOUCH_DISTANCE:
			if ghost.frightened:
				_eat_ghost(ghost)
			else:
				get_tree().reload_current_scene() # For now, getting caught restarts the game.
			return


func _eat_ghost(ghost: Ghost) -> void:
	var points: int = GHOST_POINTS[mini(_ghosts_eaten, GHOST_POINTS.size() - 1)]
	_ghosts_eaten += 1
	_add_score(points)
	ghost.eat()
	_show_points(points, ghost.position)


## A small score label that floats where something was eaten.
func _show_points(points: int, at: Vector2) -> void:
	var label := Label.new()
	label.text = str(points)
	label.add_theme_font_size_override(&"font_size", 9)
	label.add_theme_color_override(&"font_color", Color(0.4, 0.9, 1.0))
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.size = Vector2(40, 14)
	label.position = at - label.size / 2
	world.add_child(label)
	var tween := get_tree().create_tween()
	tween.tween_interval(1.2)
	tween.tween_callback(label.queue_free)
```

Reset the combo when a fright starts, at the top of `_start_fright`:

```gdscript title="game.gd" ins={2}
func _start_fright() -> void:
	_ghosts_eaten = 0
	mode_timer.paused = true # The scatter/chase clock stops while ghosts are frightened.
```

And add `@onready var world: Node2D = $World` next to the other node references.

- **`mini(_ghosts_eaten, GHOST_POINTS.size() - 1)`** caps the index at 3. With four ghosts, and revived ghosts no longer frightened, you can't catch more than four per power pellet, so this is a safety net: add a fifth ghost and it scores 1600 instead of crashing.
- **`_show_points`** builds a `Label` from code: a `Control` can live under a `Node2D` just fine. It's added to `World`, so its position is in maze coordinates, centred on the ghost.
- A **tween** with an interval and a callback is a tidy one-shot timer: after 1.2 seconds, `queue_free` removes the label. `get_tree().create_tween()` makes a tween that isn't tied to any node; chapter 7 explains why that matters here.

Run the game, eat a power pellet, and chase the blue ghosts. Their eyes zip home, they pop back out a moment later in full colour, and touching them again is dangerous.

```quiz
question: You eat a power pellet and catch two ghosts, then eat another power pellet and catch one more. What does the third ghost score?
options:
  - "200"
  - "800"
  - "1600"
answer: 0
explain: '`_start_fright` resets `_ghosts_eaten` to 0, so the combo starts again at 200.'
```

```quiz
question: What makes eaten eyes find their way home?
options:
  - An A* path to the house
  - The usual movement rule, with the tile above the door as the target
  - They fly straight through the walls
answer: 1
```
