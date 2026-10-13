---
title: Lives
description: Losing a life, respawning with await, invaders landing, and a bonus life.
estimatedMinutes: 25
---

The rules:

- You start with **3 lives**. An invader shot costs one.
- After a hit, everything freezes for two seconds while your cannon smoulders, then you respawn in the middle.
- If the invaders **land** (reach your cannon's row), the game is over, however many lives you have.
- At **1,500 points** you earn one extra life.

## Clearing the screen

When you die, every shot in flight should disappear, otherwise one could hit your fresh cannon the moment it respawns. Open both `player_shot.tscn` and `invader_shot.tscn` and add their root nodes to a new group, `shots`. The invader shot is now in two groups: `invader_shots` for counting and `shots` for clearing.

## Respawning

The player needs a way back. Remember where it started:

```gdscript title="player.gd" ins={3}
@onready var ship: Sprite2D = $Ship
@onready var explosion: AnimatedSprite2D = $Explosion
@onready var start_x := position.x
```

```gdscript title="player.gd"
func respawn() -> void:
	_alive = true
	position.x = start_x
	ship.show()
	explosion.hide()
	explosion.stop()
```

## The game counts lives

Add a `Timer` named `RespawnTimer` to `game.tscn`: **Wait Time** `2`, **One Shot** on. Then:

```gdscript title="game.gd" ins={1-2}
## Reaching this score earns one extra life.
const EXTRA_LIFE_SCORE := 1500
## The mystery ship only appears while at least this many invaders are left.
const UFO_MIN_INVADERS := 8
```

```gdscript title="game.gd" ins={2-3,5,8,14}
var score := 0
var lives := 3
var _extra_life_awarded := false

@onready var player: Area2D = $Player
@onready var formation: Node2D = $Formation
@onready var hud: CanvasLayer = $HUD
@onready var respawn_timer: Timer = $RespawnTimer
@onready var ufo_timer: Timer = $UfoTimer


func _ready() -> void:
	hud.set_score(score)
	hud.set_lives(lives)
	formation.build(1)
	formation.start()
	ufo_timer.start()
```

Replace the one-line `_on_player_died` from chapter 4:

```gdscript title="game.gd"
func _on_player_died() -> void:
	lives -= 1
	hud.set_lives(lives)
	formation.stop()
	_clear_shots()
	if lives <= 0:
		_end_game()
		return
	respawn_timer.start()
	await respawn_timer.timeout
	player.respawn()
	formation.start()


func _clear_shots() -> void:
	get_tree().call_group("shots", "queue_free")


func _end_game() -> void:
	formation.stop()
	ufo_timer.stop()
	print("Game over! Score: ", score)
```

### await

`await respawn_timer.timeout` **pauses this function** until the timer fires. The rest of the game keeps running: the explosion animates, the UFO flies on. Two seconds later the function picks up where it left off and respawns the player. Without `await`, you'd split this into two functions and connect the timer's signal to the second one.

:::tip[Why a Timer node and not create_timer?]
`await get_tree().create_timer(2.0).timeout` works too, and needs no node. But that timer belongs to the SceneTree, not to the game: it keeps running while the game is paused, and it outlives the scene if the player quits to the menu. A `Timer` node inside `game.tscn` pauses with the game, and if the scene is freed, the function waiting on it is simply never resumed.
:::

`call_group("shots", "queue_free")` calls `queue_free()` on every node in the group: one line clears the screen.

`_end_game` is a stand-in for now; chapter 8 gives it a proper game over screen.

## A bonus life

```gdscript title="game.gd" ins={4-7}
func _add_score(points: int) -> void:
	score += points
	hud.set_score(score)
	if not _extra_life_awarded and score >= EXTRA_LIFE_SCORE:
		_extra_life_awarded = true
		lives += 1
		hud.set_lives(lives)
```

The flag makes sure it only happens once per game.

## Invaders landing

The formation knows how low it is, so it raises the alarm. Add a signal and a constant:

```gdscript title="formation.gd" ins={3}
signal invader_killed(invader: Invader)
signal cleared
signal landed
```

```gdscript title="formation.gd" ins={3-4}
## How close an invader's centre may get to the screen edge.
const MARGIN := 24.0
## An invader this low has reached the player: game over.
const LANDING_Y := 300.0
```

Track the lowest invader while measuring, and check after every drop:

```gdscript title="formation.gd" ins={5,9,16-17}
func _on_step_timer_timeout() -> void:
	# Measure the formation using only the invaders still alive.
	var left := INF
	var right := -INF
	var bottom := -INF
	for invader in _invaders:
		left = minf(left, invader.global_position.x)
		right = maxf(right, invader.global_position.x)
		bottom = maxf(bottom, invader.global_position.y)
	var next_left := left + STEP * _direction
	var next_right := right + STEP * _direction
	if next_left < MARGIN or next_right > get_viewport_rect().size.x - MARGIN:
		# The next step would cross the edge: drop down and turn around instead.
		position.y += DROP
		_direction = -_direction
		if bottom + DROP >= LANDING_Y:
			landed.emit()
	else:
		position.x += STEP * _direction
	for invader in _invaders:
		invader.step()
```

An invader's centre at y = 300 puts its feet at 308, the top of your cannon. Connect `landed` to `Game`:

```gdscript title="game.gd"
func _on_formation_landed() -> void:
	# Invaders reached the ground: game over, however many lives are left.
	player.explode()
	lives = 0
	hud.set_lives(lives)
	_end_game()
```

This is why `explode()` is separate from `hit()`: the ship blows up without `died` being emitted, so it doesn't cost a life the normal way.

```quiz
question: While `_on_player_died` waits on `await respawn_timer.timeout`, what does the rest of the game do?
options:
  - Everything freezes until the timer fires
  - It keeps running; only this function is paused
  - The function is cancelled
answer: 1
explain: '`await` suspends just the one function. Other nodes keep processing, which is why the explosion keeps animating.'
```

```quiz
question: The player has 4 lives when the invaders land. How many lives are left afterwards?
type: text
answer: ["0", "zero", "none"]
```
