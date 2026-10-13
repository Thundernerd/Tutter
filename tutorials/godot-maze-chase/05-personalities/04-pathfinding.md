---
title: What about pathfinding?
description: Try AStarGrid2D on a ghost, and see why the simple rule makes a better game.
estimatedMinutes: 25
---

The movement rule measures distance **in a straight line**, through walls. It's easily fooled: a ghost might take a branch that points towards you but leads into a long detour. Wouldn't real pathfinding, which finds the actual shortest route, make better ghosts?

Let's try it. Godot has a grid pathfinder built in: **`AStarGrid2D`**.

## A* on the maze

Add an `AStarGrid2D` to `maze.gd` and fill it from the layout:

```gdscript title="maze.gd"
var _astar := AStarGrid2D.new()


func _build_astar() -> void:
	_astar.region = Rect2i(Vector2i.ZERO, grid_size)
	_astar.diagonal_mode = AStarGrid2D.DIAGONAL_MODE_NEVER
	_astar.update()
	for y in grid_size.y:
		for x in grid_size.x:
			var cell := Vector2i(x, y)
			_astar.set_point_solid(cell, not is_open(cell))


## The shortest route between two open cells, as a list of cells (empty if there's none).
func find_path(from: Vector2i, to: Vector2i) -> Array[Vector2i]:
	from = from.clamp(Vector2i.ZERO, grid_size - Vector2i.ONE)
	to = to.clamp(Vector2i.ZERO, grid_size - Vector2i.ONE)
	if _astar.is_point_solid(from) or _astar.is_point_solid(to):
		return []
	return _astar.get_id_path(from, to)
```

and call `_build_astar()` in `_ready`, after `_build_walls()`:

```gdscript title="maze.gd" ins={5}
func _ready() -> void:
	_rows = LAYOUT.strip_edges().split("\n")
	grid_size = Vector2i(_rows[0].length(), _rows.size())
	_build_walls()
	_build_astar()
	reset_pellets()
```

- **`region`** is the rectangle of cells the pathfinder knows about; **`update()`** must be called after changing it, and before marking cells.
- **`DIAGONAL_MODE_NEVER`** keeps paths to up/down/left/right steps, like our actors.
- **`set_point_solid`** marks walls (and the ghost door) as blocked.
- **`get_id_path`** returns the cells along the shortest route, start and end included. The A\* algorithm finds it quickly by always exploring the most promising cells first.
- `find_path` clamps both cells into the grid (the tunnel reaches outside it) and returns an empty list when either end is a wall, since targets often are.

## A ghost that uses it

The movement rule doesn't need to change: only the way we *measure* distance. In `ghost.gd`, add an export and upgrade `_distance`:

```gdscript title="ghost.gd" ins={1-2,6-9}
## Use real paths (A*) instead of straight-line distance when picking a direction.
@export var use_pathfinding := false


func _distance(from: Vector2i, to: Vector2i) -> float:
	if use_pathfinding:
		var path := maze.find_path(from, to)
		if not path.is_empty():
			return path.size()
	return from.distance_squared_to(to)
```

With `use_pathfinding` on, a ghost at a junction asks "how long is the real route from each option to the target?" and takes the shortest. Since the ghost still never reverses, this is the best possible move under the same rules. When there's no path (a target in a wall), it falls back to the straight line.

To see the route, add three lines to the end of the loop in `target_debug.gd`'s `_draw()`:

```gdscript title="target_debug.gd" ins={6-8}
func _draw() -> void:
	for ghost: Ghost in get_tree().get_nodes_in_group(&"ghosts"):
		# ...
		draw_rect(square, ghost.color, false, 1.0)
		draw_line(ghost.position, square.get_center(), Color(ghost.color, 0.5), 1.0)
		if ghost.use_pathfinding:
			for path_cell in ghost.maze.find_path(ghost.cell, target):
				draw_circle(ghost.maze.cell_center(path_cell), 1.5, Color.WHITE)
```

Now select `Ember`, tick **Use Pathfinding**, run the game and press <kbd>F1</kbd>. A dotted white line shows Ember's route to you.

## So why don't we use it?

Play for a minute with A\* Ember, then try ticking it on all four ghosts. A few things become clear:

| | Straight-line rule | A\* |
| --- | --- | --- |
| Ember alone | Follows you, but takes detours you can exploit | Takes the perfect route every time |
| All four ghosts | Spread out, each with its own target | Still spread out, but every one is optimal: very hard |
| Predictability | Players can learn and outsmart it | Nothing to learn: it's just always right |
| Feel | Ghosts "make mistakes" you can see coming | Relentless |

The arcade ghosts are fun **because** they're beatable in understandable ways. You can bait Rosie, outrun Ember around a block, and ignore Pumpkin when it's close. The flaws are the game. A perfect pursuer removes the skill from escaping and turns it into luck.

The other half of the answer: the ghosts already *look* smart without A\*. Their teamwork comes from the targets, not from route planning. The straight-line rule is cheap, tiny, and easy to tune, and those turn out to be better qualities in a game AI than being optimal.

:::tip[Where A\* shines]
Pathfinding is the right tool when an enemy must reach a specific spot through a complicated level: a guard going back to its post, a unit following a click in a strategy game. In this very game, eaten ghosts going back home could use it. The straight-line rule gets them there fine, though, because the house is in the middle of the maze.
:::

Untick **Use Pathfinding** on Ember before moving on; the rest of the tutorial uses the classic rule.

```quiz
question: What did we change to make a ghost use A*?
options:
  - The movement rule; ghosts now follow the A* path step by step and may reverse
  - Only the distance measure inside the rule; the ghost still never reverses
  - The target tiles
answer: 1
```

```quiz
question: Why is `AStarGrid2D.update()` called before `set_point_solid()`?
options:
  - update() rebuilds the grid after changing settings like `region`, which would clear points marked before it
  - update() computes all paths in advance
  - It isn't required; it's only for performance
answer: 0
```
