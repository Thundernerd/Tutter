---
title: Target tiles
description: Separate "where to go" from "how to get there", draw it for debugging, and get caught.
estimatedMinutes: 20
---

## Where vs how

The movement rule is the *how*. The interesting part, the part that gives each ghost a personality, is the *where*: the **target tile**. Let's give it a function of its own, so the rule never has to change again:

```gdscript title="ghost.gd"
## The cell this ghost is heading for right now.
func get_target() -> Vector2i:
	return get_chase_target()


## Where to go in chase mode. Each ghost's script overrides this.
func get_chase_target() -> Vector2i:
	return player.cell
```

and use it in `_choose_direction`:

```gdscript title="ghost.gd" del={5} ins={6}
func _choose_direction() -> Vector2i:
	# ...
	if options.is_empty():
		return -direction # A dead end: the only way out is back.
	var target := player.cell
	var target := get_target()
	var best := options[0]
```

Right now there's one layer of indirection too many: `get_target` just calls `get_chase_target`. In chapter 6, ghosts get other modes (scattering to their corner, fleeing when frightened, going home when eaten), and `get_target` is where they'll be chosen. `get_chase_target` is the part the next chapter overrides per ghost.

A target tile **doesn't have to be reachable**. It can be inside a wall or even outside the maze; the rule only compares distances. That freedom is what makes the next chapter's personalities possible.

## Seeing the targets

Targets are invisible, which makes them hard to reason about. A small debug overlay helps a lot. Add an input action `toggle_targets` bound to <kbd>F1</kbd>, then create `target_debug.gd`:

```gdscript title="target_debug.gd"
extends Node2D
## Draws where each ghost is heading. Toggle it with F1 (the toggle_targets action).


func _ready() -> void:
	hide()


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed(&"toggle_targets"):
		visible = not visible


func _process(_delta: float) -> void:
	if visible:
		queue_redraw()


func _draw() -> void:
	for ghost: Ghost in get_tree().get_nodes_in_group(&"ghosts"):
		var target := ghost.get_target()
		var square := Rect2(Vector2(target * Maze.TILE), Vector2(Maze.TILE, Maze.TILE))
		draw_rect(square, ghost.color, false, 1.0)
		draw_line(ghost.position, square.get_center(), Color(ghost.color, 0.5), 1.0)
```

Add a `Node2D` named `TargetDebug` under `World` (after `Ghosts`, so it draws on top) and attach the script.

- **`_draw()`** is where a `CanvasItem` draws custom shapes. Godot calls it once and caches the result; **`queue_redraw()`** asks for a fresh `_draw()` on the next frame. Calling it every frame while visible keeps the overlay live.
- **`get_nodes_in_group(&"ghosts")`** is why we put the ghost scene in a group. `for ghost: Ghost in ...` gives the loop variable a type, so `ghost.color` gets autocompletion.
- Because `TargetDebug` is a child of `World`, it draws in maze coordinates, just like the ghosts. `Color(ghost.color, 0.5)` is the ghost's colour at half opacity.

Run the game and press <kbd>F1</kbd>: a red square follows you around, with a line from Ember to it.

## Getting caught

Last piece for this chapter: if Ember touches the player, the game should end. Add this to `game.gd`:

```gdscript title="game.gd" ins={3-4,8,14-18}
extends Node2D

## How close (in pixels) the player and a ghost or fruit must be to touch.
const TOUCH_DISTANCE := 6.0

var score := 0

@onready var ghosts := $World/Ghosts.get_children()


# ...


func _physics_process(_delta: float) -> void:
	for ghost: Ghost in ghosts:
		if player.position.distance_to(ghost.position) < TOUCH_DISTANCE:
			get_tree().reload_current_scene() # For now, getting caught restarts the game.
			return
```

:::note[Why not Area2D?]
In most Godot games you'd give the player and the ghosts an `Area2D` with a collision shape, put them on separate collision layers, and connect `area_entered`. Here a distance check is simpler and more robust: everything already moves on a grid, there are only four ghosts, and we'll want to re-check "is a frightened ghost touching me?" every frame, not only when an overlap *starts*. The arcade original did the same: it compared tiles.
:::

Six pixels is a bit more than half a tile, so the player and a ghost touch when their sprites clearly overlap, and they can't slip through each other: even at top speed they close in by less than 3 pixels per physics tick.

Run it, and get caught on purpose. One ghost chasing you is a decent game already, but it's easy to shake off: Ember always follows directly behind. Next chapter, three more ghosts, each with its own idea of where to go.

```quiz
question: Ember's target is a tile inside a wall. What happens?
options:
  - Godot reports an error
  - Ember stops moving
  - Nothing special; Ember picks the open neighbour closest to that tile, as usual
answer: 2
explain: The rule only compares distances to the target. It never needs to reach it.
```

```quiz
question: Why does the overlay call `queue_redraw()` every frame?
options:
  - Because `_draw()` only runs when asked; otherwise the old drawing stays on screen
  - To make the overlay draw on top of the ghosts
  - Because `_process` clears the canvas every frame
answer: 0
explain: Godot caches whatever `_draw()` drew. `queue_redraw()` schedules a fresh `_draw()` for the next frame.
```
