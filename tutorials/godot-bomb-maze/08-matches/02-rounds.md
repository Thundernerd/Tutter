---
title: Rounds and draws
description: Deciding the round a moment after the last death, freezing the arena, and reloading.
estimatedMinutes: 20
---

A round ends when at most one bomber is left. That sounds like a one-liner, but think about the classic finish: the last two bombers are caught in the same chain reaction. Their `died` signals fire one after the other, a few frames apart. If we ended the round on the first death, the one who died a moment later would "win".

The fix is a short grace period. Each death starts a one-second **settle timer**; when it runs out, we count who's still alive:

| Alive after the settle time | Result |
| --- | --- |
| 2 or more | Nothing: the round goes on |
| 1 | That bomber wins the round |
| 0 | A draw: nobody gets a point |

## The timer

Add a `Timer` named `SettleTimer` to `game.tscn`: **Wait Time** `1`, **One Shot** on. Connect its `timeout` to `Game`.

```gdscript title="game.gd" ins={2,5,10}
var bombers: Array[Bomber] = []
var round_over := false

@onready var arena: Arena = $Arena
@onready var settle_timer: Timer = $SettleTimer

# In _spawn_bombers, after setting up each bomber:
		else:
			bomber.controls = info.controls
		bomber.died.connect(_on_bomber_died)
		arena.actors.add_child(bomber)
```

```gdscript title="game.gd"
func _on_bomber_died(_bomber: Bomber) -> void:
	# Wait a moment before deciding: if the last two bombers die in the
	# same blast, that's a draw, not a win for whoever died last.
	settle_timer.start()


func _on_settle_timer_timeout() -> void:
	var alive := bombers.filter(func(bomber: Bomber) -> bool: return bomber.alive)
	if alive.size() <= 1 and not round_over:
		_end_round(alive[0].index if alive.size() == 1 else -1)


func _end_round(winner: int) -> void:
	round_over = true
	# Freeze the arena: no more bombs, flames or deaths.
	arena.process_mode = Node.PROCESS_MODE_DISABLED
	Match.finish_round(winner)
	print("Round over. Winner: %d, wins: %s" % [winner, Match.wins])
	if Match.match_winner() >= 0:
		Match.restart() # A proper results screen comes in the menus chapter.
	get_tree().create_timer(3.0).timeout.connect(get_tree().reload_current_scene)
```

- `start()` on a running timer restarts it, so a death during the grace period extends it. The round is decided one second after the *last* death.
- `filter` with a lambda keeps the bombers that are still alive.
- The leading underscore in `_bomber` tells Godot the parameter is unused for now. The scoreboard will need it on the next page.

### Freezing the arena

Setting the arena's **process mode** to *Disabled* stops every node inside it: bombers, monsters, the bombs' fuse timers, the flames' tweens. Physics objects inside a disabled node are also taken out of the physics world (that's what their **Disable Mode** property, *Remove* by default, means), so a lingering flame can't kill the winner after the round is decided. One line, and the arena turns into a still picture.

### Next round

`create_timer(3.0)` makes a one-off timer owned by the `SceneTree`, and we connect its `timeout` directly to `get_tree().reload_current_scene`, a method on the tree. Three seconds later the game scene reloads: new arena, new blocks, same `Match`.

Run it and blow up player 2. Three seconds later a fresh round starts, and the Output panel shows the wins piling up.

```quiz
question: Players 1 and 2 die in the same chain reaction, 0.1 s apart. With a 1-second settle timer, what's the result?
options:
  - Player 2 wins, because they died last
  - Player 1 wins, because they died first
  - A draw
answer: 2
explain: The second death restarts the settle timer. When it runs out, nobody is alive, so `_end_round(-1)` records a draw.
```

```quiz
question: Why does setting the arena's process mode to Disabled stop flames from killing the winner after the round ends?
options:
  - Disabled nodes are deleted
  - Physics objects inside a disabled node are removed from the physics world, so the flames' Area2D stops detecting anything
  - The flames check round_over
answer: 1
```
