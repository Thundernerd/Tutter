---
title: The Match autoload
description: Who's playing and who's winning, in a node that outlives the game scene.
estimatedMinutes: 15
---

## Autoloads

An autoload is a script (or scene) Godot creates once at startup and keeps alive next to every scene. Its name becomes a global: anywhere in the project, `Match.wins` just works.

Create `match.gd`:

```gdscript title="match.gd"
extends Node
## The match in progress: who is playing, and how many rounds each has won.
## Registered as the "Match" autoload, so it survives the scene reloading every round.

enum Mode { VS_CPU, TWO_PLAYERS, TWO_PLAYERS_VS_CPU }

const ROUNDS_TO_WIN := 3
const COLORS: Array[Color] = [
	Color(1, 1, 1),
	Color(1, 0.45, 0.45),
	Color(0.45, 0.8, 1),
	Color(1, 0.85, 0.3),
]

var mode := Mode.TWO_PLAYERS
## One entry per bomber: {name, color, controls}. Empty controls means CPU.
var bombers: Array[Dictionary] = []
var wins: Array[int] = []
var round_number := 1


func _ready() -> void:
	start(mode) # So the game scene also works when run on its own (F6).


func start(new_mode: Mode) -> void:
	mode = new_mode
	bombers.clear()
	match mode:
		Mode.VS_CPU:
			_add("P1", "p1")
			_add("CPU 1")
			_add("CPU 2")
			_add("CPU 3")
		Mode.TWO_PLAYERS:
			_add("P1", "p1")
			_add("P2", "p2")
		Mode.TWO_PLAYERS_VS_CPU:
			_add("P1", "p1")
			_add("P2", "p2")
			_add("CPU 1")
			_add("CPU 2")
	restart()


## Same players, scores back to zero.
func restart() -> void:
	wins.clear()
	wins.resize(bombers.size())
	wins.fill(0)
	round_number = 1


func _add(bomber_name: String, controls := "") -> void:
	bombers.append({name = bomber_name, color = COLORS[bombers.size()], controls = controls})


## Record a round: the winner's index, or -1 for a draw.
func finish_round(winner: int) -> void:
	if winner >= 0:
		wins[winner] += 1
	round_number += 1


## The index of whoever has won the match, or -1 if it isn't over yet.
func match_winner() -> int:
	for i in wins.size():
		if wins[i] >= ROUNDS_TO_WIN:
			return i
	return -1
```

Register it in **Project Settings → Globals → Autoload**: pick `match.gd`, keep the name `Match`, and click **Add**.

- **Modes** decide who plays. "1 player vs CPU" fills all four corners: you against three CPUs. Colours are handed out in order, so player 1 is always white.
- **`start(mode)`** sets up the players; **`restart()`** keeps them but zeroes the score, for a rematch.
- `_ready` starts a two-player match, so `game.tscn` still works when you run it directly with <kbd>F6</kbd>, before any menu has called `start`.
- The bomber entries are the same dictionaries `game.gd` had in `BOMBERS`. That's no accident: we're moving them here.
- `ROUNDS_TO_WIN` becomes a setting in the options chapter.

:::note[`Match` and `match`]
`match` (lowercase) is a GDScript keyword. `Match` (capitalised) is just a name, so the autoload and the keyword live happily side by side, as you can see in `start()`.
:::

## The game uses the match

Delete the `BOMBERS` constant from `game.gd` and spawn from `Match.bombers` instead. Also tell each bomber its index into that list, which the scoreboard will need:

```gdscript title="game.gd" del={3-4} ins={5-6,9}
func _spawn_bombers() -> void:
	var spawns := arena.spawn_cells()
	for i in BOMBERS.size():
		var info: Dictionary = BOMBERS[i]
	for i in Match.bombers.size():
		var info: Dictionary = Match.bombers[i]
		var bomber: Bomber = bomber_scene.instantiate()
		bomber.arena = arena
		bomber.index = i
		# ...
```

```gdscript title="bomber.gd" ins={3-4}
## Set by the game before the bomber enters the tree.
var arena: Arena
## Index into Match.bombers.
var index := 0
var is_cpu := false
```

Run it: two players, as configured by `Match._ready`.

```quiz
question: Why can't the win counts live in `game.gd`?
options:
  - Scripts attached to Node2D can't store integers
  - The game scene is reloaded every round, which resets all of its variables
  - Autoloads are faster
answer: 1
```

```quiz
question: What does `Match.match_winner()` return when wins are [2, 3, 0, 1] and ROUNDS_TO_WIN is 3?
type: text
answer: ["1"]
explain: Index 1 has 3 wins, which reaches ROUNDS_TO_WIN.
```
