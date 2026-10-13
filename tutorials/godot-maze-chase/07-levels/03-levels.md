---
title: Levels
description: Clearing the maze, and a table of numbers that makes every level harder.
estimatedMinutes: 25
---

Eat every pellet and the level is cleared: the maze refills, and the next level is a little harder. The arcade games made levels harder purely with numbers. Nothing new appears; the player and ghosts get faster, frightened time gets shorter, and the ghosts leave the house sooner.

## A level table

Put all the per-level numbers in one place, at the top of `game.gd`:

```gdscript title="game.gd"
## Speed of "100%" in the level table, in pixels per second.
const BASE_SPEED := 90.0
## Per-level tuning. Levels past the end of the list reuse the last entry.
## player/ghost: speed as a fraction of BASE_SPEED. fright: seconds ghosts stay blue.
## fruit: frame in fruit.png. release: pellets each ghost waits for before leaving the house.
const LEVELS := [
	{player = 0.80, ghost = 0.75, fright = 6.0, fruit = 0, release = [0, 0, 30, 60]},
	{player = 0.90, ghost = 0.85, fright = 5.0, fruit = 1, release = [0, 0, 0, 50]},
	{player = 0.90, ghost = 0.85, fright = 4.0, fruit = 2, release = [0, 0, 0, 0]},
	{player = 0.90, ghost = 0.85, fright = 3.0, fruit = 2, release = [0, 0, 0, 0]},
	{player = 1.00, ghost = 0.95, fright = 2.0, fruit = 3, release = [0, 0, 0, 0]},
	{player = 1.00, ghost = 0.95, fright = 2.0, fruit = 4, release = [0, 0, 0, 0]},
]

var level := 1


func _level_data() -> Dictionary:
	return LEVELS[mini(level, LEVELS.size()) - 1]


func _apply_level_speeds() -> void:
	var data := _level_data()
	player.speed = BASE_SPEED * data.player
	for ghost: Ghost in ghosts:
		ghost.speed = BASE_SPEED * data.ghost
```

Delete the old `FRIGHT_TIME` and `RELEASE_PELLETS` constants; their values now come from the table.

- **`{player = 0.80, ...}`** is a dictionary written in "Lua style": `player = 0.80` means the key `&"player"` (a `StringName`). You can read a value with `data.player` or `data["player"]`.
- The speeds follow the arcade machines' proportions: on level 1 the player moves at 80% and the ghosts at 75%, so you're only slightly faster. By level 5, both are near full speed and the ghosts are just behind you.
- **`fright`** shrinks from 6 seconds to 2: on later levels, a power pellet buys you very little time.
- **`mini(level, LEVELS.size())`** makes level 7, 8, 9... reuse the last entry. Add rows to make the game evolve for longer.

`player.speed` and `ghost.speed` are the exported speeds from earlier chapters; the table now overrides them at the start of every round. The ghosts' fright, tunnel, house and eyes speeds stay as they are.

## Using the table

Four places change. Apply the speeds whenever a round starts:

```gdscript title="game.gd" ins={6}
func _start_round() -> void:
	_set_world_running(false)
	player.reset()
	for ghost: Ghost in ghosts:
		ghost.reset()
	_apply_level_speeds()
```

Use the table's fright time, give the player a small speed boost while the ghosts are blue (another arcade detail), and put the normal speeds back afterwards:

```gdscript title="game.gd" ins={4-5,14}
func _start_fright() -> void:
	_ghosts_eaten = 0
	mode_timer.paused = true # The scatter/chase clock stops while ghosts are frightened.
	fright_timer.start(_level_data().fright)
	player.speed = BASE_SPEED * minf(_level_data().player + 0.1, 1.0)
	for ghost: Ghost in ghosts:
		ghost.frighten()


func _on_fright_timer_timeout() -> void:
	mode_timer.paused = false
	for ghost: Ghost in ghosts:
		ghost.calm()
	_apply_level_speeds()
```

And in `_release_ghosts`, read the limits from the table:

```gdscript title="game.gd" del={2} ins={3}
func _release_ghosts() -> void:
	var limits: Array = RELEASE_PELLETS
	var limits: Array = _level_data().release
```

## Clearing a level

When the last pellet is eaten, freeze, hide the ghosts, pause for a moment, then refill the maze and start a round on the next level. At the end of `_on_player_ate_pellet`:

```gdscript title="game.gd"
	if maze.pellets_left == 0:
		_clear_level()
```

```gdscript title="game.gd"
func _clear_level() -> void:
	_set_world_running(false)
	await _wait(1.0)
	for ghost: Ghost in ghosts:
		ghost.hide()
	await _wait(1.0)
	level += 1
	maze.reset_pellets()
	_start_round()
```

`maze.reset_pellets()` from chapter 2 puts every pellet back. In chapter 8 the second wait becomes a "Level clear!" screen, and in chapter 10 the maze flashes.

## Showing the level

Add a level number to the right panel of the HUD, with a small picture of the level's bonus fruit next to it (the fruit itself arrives on the next page):

| Node | Position | Size | Notes |
| --- | --- | --- | --- |
| `LevelTitle` (Label) | (20, 40) | 140×16 | "LEVEL", font size 11, grey |
| `LevelLabel` (Label, %) | (20, 54) | 40×28 | "1", font size 22 |
| `FruitIcon` (TextureRect, %) | (56, 61) | 14×14 | New AtlasTexture: `art/fruit.png`, region (0, 0, 14, 14) |

```gdscript title="hud.gd"
@onready var level_label: Label = %LevelLabel
@onready var fruit_icon: TextureRect = %FruitIcon


func update_level(level: int, fruit_frame: int) -> void:
	level_label.text = str(level)
	var atlas := fruit_icon.texture as AtlasTexture
	atlas.region.position.x = fruit_frame * atlas.region.size.x
```

Moving the atlas region along the sprite sheet switches the picture: frame 1 starts at x = 14, frame 2 at x = 28, and so on. Call it in `_start_round`, right after `_apply_level_speeds()`:

```gdscript title="game.gd"
	hud.update_level(level, _level_data().fruit)
```

```quiz
question: On level 9, which entry of LEVELS is used?
options:
  - The first (index 0)
  - The last (index 5)
  - None; the game crashes
answer: 1
explain: '`mini(9, 6) - 1` is 5, the last entry.'
```

```quiz
question: In the level table, `{player = 0.80}` creates a dictionary with which key?
options:
  - The value of a variable called `player`
  - The name "player", as a StringName
  - The number 0.80
answer: 1
explain: In Lua-style dictionaries, the name before `=` becomes the key (a `StringName`). It doesn't look up a variable.
```
