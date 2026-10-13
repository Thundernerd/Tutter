---
title: The movement rule
description: Never turn around, and take the exit closest to the target.
estimatedMinutes: 20
---

## One rule for every ghost

The ghosts in the arcade classics don't plan routes. At every tile, each ghost follows the same rule:

1. List the directions it could go: every open neighbour, **except straight back** the way it came.
2. Pick the one whose next tile is **closest in a straight line** to its **target tile**.
3. On a tie, prefer **up, then left, then down, then right**.

That's it. A ghost in a corridor has only one option, so it follows the corridor. At a junction, it picks the branch that points most towards its target. It never turns around by itself, which is why you can outrun a ghost: once it has committed to a corridor, it has to go all the way to the next junction.

The "never reverse" rule matters more than it seems. Without it, a ghost would jitter back and forth whenever two routes looked equally good, and it could get stuck circling a wall forever. With it, ghosts flow smoothly through the maze, and their behaviour is predictable enough for skilled players to learn.

## The code

Add this to `ghost.gd`:

```gdscript title="ghost.gd"
func _physics_process(delta: float) -> void:
	move_on_grid(speed * delta)
	_update_sprite()


func _on_tile_center() -> void:
	direction = _choose_direction()


## The classic rule: never turn around, and take the exit closest to the target.
func _choose_direction() -> Vector2i:
	var options: Array[Vector2i] = []
	for dir in DIRECTIONS:
		if dir != -direction and maze.is_open(cell + dir):
			options.append(dir)
	if options.is_empty():
		return -direction # A dead end: the only way out is back.
	var target := player.cell
	var best := options[0]
	var best_distance := INF
	for dir in options:
		var distance := _distance(cell + dir, target)
		if distance < best_distance:
			best = dir
			best_distance = distance
	return best


func _distance(from: Vector2i, to: Vector2i) -> float:
	return from.distance_squared_to(to)
```

- The loop over `DIRECTIONS` builds the options in priority order. Then the second loop only replaces `best` when a direction is **strictly** closer (`<`, not `<=`), so on a tie the earlier direction (up, left, down, right) wins.
- **Squared distance** compares just as well as real distance (if *a* < *b* then *a*² < *b*²) and skips the square root. `Vector2i.distance_squared_to` returns an integer, which GDScript happily compares with the float `INF`.
- The maze has no dead ends, so `options` is never empty in practice. Returning `-direction` is a safety net in case you design a maze that has one.
- `_distance` is its own function because chapter 5 swaps in a different way of measuring distance.

For now, the target is simply the player's cell. Run the game: Ember leaves the door and hunts you down. Lead it around a block and notice how it commits to corridors; it can't turn back to cut you off.

:::note[Deciding at the centre]
The arcade original decided one tile *ahead*, as soon as a ghost entered a tile. Deciding at the centre, like we do, is simpler and plays the same: by the time a ghost reaches a junction's centre it has seen exactly the same information.
:::

```quiz
question: A ghost moving right reaches a junction where up, down and right are open. Up and right are equally close to the target; down is further. Which way does it go?
options:
  - Up
  - Right
  - Down
  - Left
answer: 0
explain: Left is excluded (that's reversing). Up and right tie, and up comes first in the priority order.
```

```quiz
question: What would go wrong if ghosts were allowed to reverse whenever it brought them closer?
options:
  - Nothing, they would just be harder to escape
  - They would jitter back and forth and could get stuck oscillating near walls
  - The game would run slower
answer: 1
```
