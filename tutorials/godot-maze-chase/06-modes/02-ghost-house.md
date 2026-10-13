---
title: The ghost house
description: A small state machine, ghosts bobbing at home, and the rules for letting them out.
estimatedMinutes: 25
---

In the arcade games, only the red ghost starts in the maze. The other three wait in the **ghost house** and come out one at a time, which gives you a gentle start to every level.

## States

Ghosts now behave differently depending on where they are, so it's time for an explicit **state machine**. Add an enum and a `state` variable to `ghost.gd`:

```gdscript title="ghost.gd"
enum State { IN_HOUSE, LEAVING, ROAMING, EATEN, ENTERING }

@export var start_in_house := true

var state := State.IN_HOUSE
```

| State | What the ghost does |
| --- | --- |
| `IN_HOUSE` | Bobs up and down, waiting to be released |
| `LEAVING` | Walks to the door and up through it |
| `ROAMING` | Moves through the maze with the usual rule (scatter, chase or frightened) |
| `EATEN` | Only eyes left, racing back to the house (page 4) |
| `ENTERING` | Eyes walking down through the door into the house (page 4) |

Scatter, chase and frightened aren't states here. They change the *target* and the speed, but the ghost moves the same way in all three, so they're flags (`chasing`, and soon `frightened`) on top of `ROAMING`.

## Moving in the house

Inside the house the grid rule doesn't apply: ghosts move along fixed paths. Two helpers handle that:

```gdscript title="ghost.gd"
## Bobs up and down while waiting in the house.
func _bob(step: float) -> void:
	var limit := start_position.y + direction.y * 4.0
	position.y = move_toward(position.y, limit, step)
	if position.y == limit:
		direction = -direction


## Moves towards `point`, first horizontally, then vertically. Returns true on arrival.
func _walk_to(point: Vector2, step: float) -> bool:
	if position.x != point.x:
		direction = Vector2i(signf(point.x - position.x), 0)
		position.x = move_toward(position.x, point.x, step)
	else:
		direction = Vector2i(0, signf(point.y - position.y))
		position.y = move_toward(position.y, point.y, step)
	return position == point


## Lets the ghost out of the house.
func release() -> void:
	if state == State.IN_HOUSE:
		state = State.LEAVING
```

- **`_bob`** moves up to 4 pixels above the start position, then down to 4 below, and so on. `move_toward(from, to, step)` moves a number towards a target without overshooting, so `position.y == limit` becomes exactly true on arrival.
- **`_walk_to`** goes horizontally first, then vertically: from the side of the house to the middle, then up through the door. Setting `direction` as it goes keeps the eyes looking the right way.

Now `_physics_process` picks the movement by state, and `reset` sets the starting state:

```gdscript title="ghost.gd"
func reset() -> void:
	position = start_position
	state = State.IN_HOUSE if start_in_house else State.ROAMING
	direction = Vector2i.UP if start_in_house else Vector2i.LEFT
	chasing = false
	_update_sprite()


func _physics_process(delta: float) -> void:
	var step := _current_speed() * delta
	match state:
		State.IN_HOUSE:
			_bob(step)
		State.LEAVING:
			if _walk_to(maze.house_exit, step):
				state = State.ROAMING
				direction = Vector2i.LEFT
		_:
			move_on_grid(step)
	_update_sprite()
```

On reaching `house_exit` (just above the door), a ghost starts roaming, heading left. Remember that `house_exit` is at x = 140, between two cells: `move_on_grid` takes it from there.

## Speeds

Ghosts move slowly in the house, and the arcade games also slowed them down in the **tunnel**: a classic escape route. Add the speeds to the `Speeds` group, and a function that picks one:

```gdscript title="ghost.gd" ins={3-4,7-13}
@export_group("Speeds")
@export var speed := 67.5
@export var tunnel_speed := 36.0
@export var house_speed := 36.0


func _current_speed() -> float:
	match state:
		State.IN_HOUSE, State.LEAVING:
			return house_speed
	if maze.is_tunnel(cell):
		return tunnel_speed
	return speed
```

Finally, two small changes so the rest of the game respects the house:

```gdscript title="ghost.gd"
## Mode changes make ghosts turn around: the player's warning that something changed.
func reverse() -> void:
	if state == State.ROAMING:
		direction = -direction


## Whether the player can bump into this ghost (it isn't tucked away in the house).
func can_touch() -> bool:
	return state == State.ROAMING or state == State.LEAVING
```

In `game.gd`'s touch check, only count ghosts that `can_touch()`:

```gdscript title="game.gd" del={2} ins={3}
	for ghost: Ghost in ghosts:
		if player.position.distance_to(ghost.position) < TOUCH_DISTANCE:
		if ghost.can_touch() and player.position.distance_to(ghost.position) < TOUCH_DISTANCE:
```

## Moving in

In `game.tscn`, untick **Start In House** on `Ember` (it stays above the door), and move the others into the house:

| Ghost | Position |
| --- | --- |
| `Rosie` | (140, 145), the middle |
| `Frost` | (120, 145), the left |
| `Pumpkin` | (160, 145), the right |

`(140, 145)` is `Maze.house_center`. Run the game: three ghosts bob in the house and stay there. Now let's let them out.

## Release rules

Ghosts leave in a fixed order (Rosie, Frost, Pumpkin), each one once you've eaten enough pellets:

| Ghost | Leaves after |
| --- | --- |
| Ember | starts outside |
| Rosie | 0 pellets: right away |
| Frost | 30 pellets |
| Pumpkin | 60 pellets |

Plus a safety valve: if you stop eating for 4 seconds, the next ghost comes out anyway. Otherwise a cautious player could keep them locked up forever by not eating.

Add a `Timer` named `ReleaseTimer` under `World` (**Wait Time** `4`, not one-shot) and connect its `timeout` to `Game`:

```gdscript title="game.gd"
## Pellets each ghost waits for before leaving the house (Ember starts outside).
const RELEASE_PELLETS := [0, 0, 30, 60]

var _pellets_this_life := 0

@onready var release_timer: Timer = $World/ReleaseTimer


func _ready() -> void:
	player.ate_pellet.connect(_on_player_ate_pellet)
	hud.update_score(score)
	mode_timer.start(MODE_SCHEDULE[0])
	release_timer.start()
	_release_ghosts()


func _on_player_ate_pellet(power: bool) -> void:
	_add_score(50 if power else 10)
	_pellets_this_life += 1
	release_timer.start() # Restart the "player is dawdling" countdown.
	_release_ghosts()


## Ghosts leave the house in order, each once enough pellets have been eaten.
func _release_ghosts() -> void:
	var limits: Array = RELEASE_PELLETS
	for i in ghosts.size():
		var ghost: Ghost = ghosts[i]
		if ghost.state != Ghost.State.IN_HOUSE:
			continue
		if _pellets_this_life < limits[i]:
			return # The ghosts behind this one wait too.
		ghost.release()


## The player hasn't eaten for a while: send the next ghost out anyway.
func _on_release_timer_timeout() -> void:
	for ghost: Ghost in ghosts:
		if ghost.state == Ghost.State.IN_HOUSE:
			ghost.release()
			return
```

- `ghosts` comes from `$World/Ghosts.get_children()`, in tree order: Ember, Rosie, Frost, Pumpkin. `RELEASE_PELLETS[i]` lines up with that order.
- The `return` in `_release_ghosts` keeps the order strict: if Frost is still waiting, Pumpkin waits too, even if it has reached its own count.
- Calling `release_timer.start()` on every pellet restarts the 4-second countdown, so it only fires when you *stop* eating.
- The counter is called `_pellets_this_life` because, from chapter 7, it starts again from zero after you lose a life.

Run it: Rosie pops out immediately, Frost after 30 pellets (or 4 idle seconds), Pumpkin after 60.

```quiz
question: Why are scatter, chase and frightened flags on the ROAMING state rather than separate states?
options:
  - Enums can only have five values
  - The ghost moves with the same rule in all three; only the target and speed change
  - Flags are faster than states
answer: 1
```

```quiz
question: You've eaten 45 pellets, so Rosie and Frost are out. Then you stop eating for 4 seconds. What happens?
options:
  - Nothing until you've eaten 60 pellets
  - Pumpkin leaves the house anyway
  - All ghosts reverse
answer: 1
explain: The ReleaseTimer fires after 4 seconds without a pellet and lets the next ghost in line out.
```
