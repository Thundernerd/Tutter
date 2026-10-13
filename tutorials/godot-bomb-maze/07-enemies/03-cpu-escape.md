---
title: "CPU bomber, part 1: staying alive"
description: A brain node that plugs into the bomber, breadth-first search, and steering like a player.
estimatedMinutes: 30
---

The CPU bomber is a normal `Bomber`, with a `CpuBrain` node added as a child. The brain doesn't move anything itself. It does what a player does: it decides on a direction and sometimes presses "bomb". The bomber's lane code, collisions, bomb limit and power-ups all work exactly the same for both.

## Plugging in a brain

The bomber needs to know not to read the keyboard:

```gdscript title="bomber.gd" ins={3,8-11}
## Set by the game before the bomber enters the tree.
var arena: Arena
var is_cpu := false

# ...

func _physics_process(delta: float) -> void:
	if not is_cpu:
		input_direction = _read_direction()
		if Input.is_action_just_pressed(controls + "_bomb"):
			place_bomb()
	velocity = _lane_velocity(input_direction, delta)
	move_and_slide()
	_animate(input_direction)
```

For CPUs, `input_direction` is whatever the brain last set.

## The brain's loop

Create `cpu_brain.gd`. It's a script without a scene, because it's just a `Node` with logic:

```gdscript title="cpu_brain.gd"
class_name CpuBrain
extends Node
## Steers its parent Bomber: escapes danger, bombs blocks and rivals,
## and picks up power-ups.

## Seconds of slack the CPU wants between reaching a cell and it catching fire.
const SAFETY_MARGIN := 0.4

## Seconds between decisions. Slower thinkers react late to new bombs.
@export var think_interval := 0.25

## The cells to walk through, next one first.
var path: Array[Vector2i] = []

var _think_timer := 0.0

@onready var bomber: Bomber = get_parent()
@onready var arena: Arena = bomber.arena


func _physics_process(delta: float) -> void:
	if not bomber.alive:
		return
	_think_timer -= delta
	if _think_timer <= 0.0:
		_think_timer = think_interval
		_think()
	bomber.input_direction = _steer()


func _think() -> void:
	var danger := arena.danger_map()
	_add_monsters(danger)
	var here := arena.cell_at(bomber.position)
	if danger.has(here):
		path = _find_path(here, danger, _is_safe.bind(danger))
		return
	path = _wander(here, danger)


## Treat monsters, and the cell they just left, as fire that's burning now.
func _add_monsters(danger: Dictionary[Vector2i, float]) -> void:
	for monster: Monster in get_tree().get_nodes_in_group("monsters"):
		if monster.alive:
			danger[monster.cell] = 0.0
			danger[monster.cell - monster.direction] = 0.0


func _is_safe(cell: Vector2i, danger: Dictionary[Vector2i, float]) -> bool:
	return not danger.has(cell)
```

The brain has two speeds:

- **Thinking** (every `think_interval` seconds) builds a danger map and plans a `path`, a list of cells.
- **Steering** (every physics tick) turns the next cell of that path into a direction.

Planning every tick would work too, but a pause between decisions makes the CPU feel more human, and later it's the knob for difficulty: an easy CPU that thinks twice a second reacts noticeably late to a new bomb.

Monsters aren't fire, but the CPU should avoid them just the same, so `_add_monsters` writes their cells (and the cell behind them) into the map as "burning now". From here on, the rest of the brain doesn't have to know monsters exist.

## Breadth-first search

To escape, the CPU needs the **nearest** safe cell it can actually reach, and the cells to walk through to get there. Breadth-first search (BFS) finds exactly that. It explores the grid in rings: first every cell one step away, then every cell two steps away, and so on. The first goal cell it reaches is therefore one of the closest.

```text
  3  2  3  #
  2  1  2  3
  1  S  1  2      S = start, numbers = steps from S
  2  1  #  3
```

```gdscript title="cpu_brain.gd"
## Breadth-first search from `start` to the nearest cell where `is_goal` is true,
## avoiding cells that will be on fire by the time we get there.
## Returns the cells to walk through (not including start), or [] if there's no way.
func _find_path(start: Vector2i, danger: Dictionary[Vector2i, float], is_goal: Callable) -> Array[Vector2i]:
	var seconds_per_cell := arena.walls.tile_set.tile_size.x / bomber.speed
	var came_from: Dictionary[Vector2i, Vector2i] = {start: start}
	var steps: Dictionary[Vector2i, int] = {start: 0}
	var queue: Array[Vector2i] = [start]
	while not queue.is_empty():
		var cell: Vector2i = queue.pop_front()
		if cell != start and is_goal.call(cell):
			return _path_to(cell, came_from)
		for direction in Arena.DIRECTIONS:
			var next := cell + direction
			if came_from.has(next) or not arena.is_free(next):
				continue
			var arrival := (steps[cell] + 1) * seconds_per_cell
			if danger.get(next, INF) < arrival + SAFETY_MARGIN:
				continue # It would be burning when we got there.
			came_from[next] = cell
			steps[next] = steps[cell] + 1
			queue.append(next)
	return []


func _path_to(goal: Vector2i, came_from: Dictionary[Vector2i, Vector2i]) -> Array[Vector2i]:
	var result: Array[Vector2i] = []
	var cell := goal
	while came_from[cell] != cell:
		result.push_front(cell)
		cell = came_from[cell]
	return result
```

- `queue` holds cells to explore, oldest first: `pop_front()` takes from the front, `append()` adds to the back. That first-in, first-out order is what makes the search go ring by ring.
- `came_from[next] = cell` records how we got to each cell. It doubles as the "already visited" set. When we find the goal, `_path_to` walks those links backwards to the start.
- `steps` counts the distance, so we can estimate **when** we'd arrive: `steps × seconds_per_cell`. A cell that will be burning by then (plus the safety margin) is skipped. That lets the CPU run *through* the far end of a blast that's still a second away, and stops it from running into one that's about to go off.
- `is_goal` is a **Callable**: the search doesn't know what it's looking for. To escape, we pass `_is_safe.bind(danger)`. `bind` sticks extra arguments on the end, so the search calls it as `_is_safe(cell, danger)`.

## Wandering

When there's no danger, the CPU takes a random safe step (we'll give it real goals on the next page):

```gdscript title="cpu_brain.gd"
## Nothing to do: take a step in a random safe direction.
func _wander(here: Vector2i, danger: Dictionary[Vector2i, float]) -> Array[Vector2i]:
	var options: Array[Vector2i] = []
	for direction in Arena.DIRECTIONS:
		var next := here + direction
		if arena.is_free(next) and not danger.has(next):
			options.append(next)
	if options.is_empty():
		return []
	return [options.pick_random()]
```

## Steering

```gdscript title="cpu_brain.gd"
## Turn the path into a direction to hold, like a player pressing keys.
func _steer() -> Vector2:
	while not path.is_empty() and bomber.position.distance_to(arena.cell_center(path[0])) < 2.0:
		path.pop_front()
	# With nowhere to go, finish stepping into the middle of the current cell:
	# a safe cell only keeps us safe once our whole body is inside it.
	var target := arena.cell_center(arena.cell_at(bomber.position))
	if not path.is_empty():
		target = arena.cell_center(path[0])
	var to_target := target - bomber.position
	if to_target.length() < 2.0:
		return Vector2.ZERO
	if absf(to_target.x) > absf(to_target.y):
		return Vector2(signf(to_target.x), 0)
	return Vector2(0, signf(to_target.y))
```

A path step is done once the bomber is within 2 pixels of that cell's centre. The direction is the larger axis of the remaining distance, the same kind of four-way input a player gives, and the bomber's lane code centres it on the way.

:::warning[The last few pixels matter]
Notice what `_steer` does with an empty path: it keeps walking to the **middle of the current cell**. An earlier version of this code just stopped. A CPU escaping a blast would enter the safe cell, the next decision would see "not in danger, nothing to do", and it would stand at the cell's edge, with its 18-pixel body still poking 9 pixels into the burning cell next door. Safe on paper, dead in practice. Testing four CPUs for a few minutes caught it.
:::

## Spawning CPUs

Add two CPU entries to the game's list, with empty `controls`:

```gdscript title="game.gd" ins={4-5}
const BOMBERS := [
	{name = "P1", color = Color(1, 1, 1), controls = "p1"},
	{name = "P2", color = Color(1, 0.45, 0.45), controls = "p2"},
	{name = "CPU 1", color = Color(0.45, 0.8, 1), controls = ""},
	{name = "CPU 2", color = Color(1, 0.85, 0.3), controls = ""},
]
```

and give those bombers a brain:

```gdscript title="game.gd" ins={9-13}
func _spawn_bombers() -> void:
	var spawns := arena.spawn_cells()
	for i in BOMBERS.size():
		var info: Dictionary = BOMBERS[i]
		var bomber: Bomber = bomber_scene.instantiate()
		bomber.arena = arena
		bomber.color = info.color
		bomber.position = arena.cell_center(spawns[i])
		if info.controls == "":
			bomber.is_cpu = true
			bomber.add_child(CpuBrain.new())
		else:
			bomber.controls = info.controls
		arena.actors.add_child(bomber)
		bombers.append(bomber)
```

`CpuBrain.new()` works because the script has a `class_name`. The brain is added *before* the bomber enters the tree, so by the time the brain's `@onready` variables run, `bomber.arena` is already set.

Run it. The two CPUs wander about, and if you drop a bomb near one, it runs.

```quiz
question: Why does breadth-first search find the nearest safe cell?
options:
  - It sorts cells by distance before searching
  - It explores every cell 1 step away before any cell 2 steps away, so the first goal it reaches is one of the closest
  - It tries random cells until one is safe
answer: 1
```

```quiz
question: What does `_is_safe.bind(danger)` create?
options:
  - A copy of the danger map
  - A Callable that calls `_is_safe(cell, danger)` when called with one argument, `cell`
  - A signal connection
answer: 1
```

```quiz
question: The path goes through a cell that will burn in 1.2 s. The CPU would arrive there in 0.6 s. With SAFETY_MARGIN 0.4, does the search allow it?
options:
  - Yes, 1.2 is not less than 0.6 + 0.4
  - No, any dangerous cell is skipped
answer: 0
explain: The check is `danger < arrival + SAFETY_MARGIN`, and 1.2 < 1.0 is false, so the cell is allowed. The CPU dashes through before it burns.
```
