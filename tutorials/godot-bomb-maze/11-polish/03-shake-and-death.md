---
title: Screen shake and a death animation
description: A camera shake that scales with the event, and bombers that flash and spin away.
estimatedMinutes: 15
---

## Screen shake

Add a `Camera2D` to `game.tscn` at **(320, 180)**, the centre of the 640×360 screen. A camera's `offset` moves the view without moving the camera node, so shaking means tweening the offset through a few random values and back to zero:

```gdscript title="game.gd"
var _shake_tween: Tween

@onready var camera: Camera2D = $Camera2D


func shake(strength: float) -> void:
	if _shake_tween:
		_shake_tween.kill()
	_shake_tween = create_tween()
	for i in 6:
		var offset := Vector2(randf_range(-strength, strength), randf_range(-strength, strength))
		_shake_tween.tween_property(camera, "offset", offset, 0.03)
	_shake_tween.tween_property(camera, "offset", Vector2.ZERO, 0.03)
```

Tweeners on one tween run one after another: six random jolts of 0.03 s, then back to rest. Two details make it feel right in a game where explosions come in clusters:

- **`strength`** scales it: a falling wall is a tap (1), an explosion a bump (2), a death a real jolt (6).
- **Killing the previous tween** first means overlapping shakes restart instead of fighting over the same `offset`.

```gdscript title="game.gd" ins={3,8,13}
func _on_bomber_died(bomber: Bomber) -> void:
	$Sounds/Death.play()
	shake(6.0)
	# ...

func _on_arena_exploded(_cells: Array[Vector2i]) -> void:
	$Sounds/Explosion.play()
	shake(2.0)


func _on_wall_dropped(_cell: Vector2i) -> void:
	$Sounds/Thud.play()
	shake(1.0)
```

The HUD and menus are on `CanvasLayer`s, so they stay perfectly still while the arena shakes.

## Death animation

Until now, a dying bomber just vanished. Replace the `hide()` at the end of `die()` with a short sequence: two white flashes, then spin twice while shrinking to nothing, *then* hide.

```gdscript title="bomber.gd" ins={10-18}
func die() -> void:
	if not alive:
		return
	alive = false
	input_direction = Vector2.ZERO
	set_physics_process(false)
	collision.set_deferred("disabled", true)
	sprite.stop()
	died.emit(self)
	# Flash white, then spin away.
	var tween := create_tween()
	tween.tween_property(sprite, "modulate", Color(4, 4, 4), 0.08)
	tween.tween_property(sprite, "modulate", Color.WHITE, 0.08)
	tween.tween_property(sprite, "modulate", Color(4, 4, 4), 0.08)
	tween.tween_property(sprite, "modulate", Color.WHITE, 0.08)
	tween.tween_property(sprite, "rotation", TAU * 2, 0.5)
	tween.parallel().tween_property(sprite, "scale", Vector2.ZERO, 0.5).set_ease(Tween.EASE_IN)
	tween.tween_callback(hide)
```

- `modulate` multiplies the sprite's colour, and values above 1 brighten it. `Color(4, 4, 4)` turns even the red bomber nearly white.
- `parallel()` makes the scale tween run *together with* the rotation instead of after it.
- The whole thing takes about 0.8 s, shorter than the 1-second settle timer, so the animation always finishes before the round result appears and the arena freezes.

The monsters already pop (grow and fade) when they burn, from the enemies chapter.

## The complete game script

`game.gd` grew in almost every chapter. Here it is in full:

```gdscript title="game.gd"
extends Node2D
## One round of Blast Grid. The scene reloads for every round; Match keeps score.

const MONSTER_COUNT := 3

@export var bomber_scene: PackedScene
@export var monster_scene: PackedScene
@export var debris_scene: PackedScene

var bombers: Array[Bomber] = []
var round_over := false
## Cells still to be walled up during sudden death, outermost first.
var _closing_cells: Array[Vector2i] = []
var _shake_tween: Tween

@onready var arena: Arena = $Arena
@onready var camera: Camera2D = $Camera2D
@onready var hud: CanvasLayer = $HUD
@onready var pause_menu: CanvasLayer = $PauseMenu
@onready var results: CanvasLayer = $Results
@onready var round_timer: Timer = $RoundTimer
@onready var settle_timer: Timer = $SettleTimer
@onready var sudden_death_timer: Timer = $SuddenDeathTimer


func _ready() -> void:
	arena.generate()
	_spawn_bombers()
	if Settings.monsters:
		_spawn_monsters()
	hud.setup(Match.bombers, Match.wins)
	arena.exploded.connect(_on_arena_exploded)
	arena.block_destroyed.connect(_on_block_destroyed)
	arena.wall_dropped.connect(_on_wall_dropped)
	round_timer.start()


func _process(_delta: float) -> void:
	if not round_timer.is_stopped():
		hud.show_time(round_timer.time_left)


func _spawn_bombers() -> void:
	var spawns := arena.spawn_cells()
	for i in Match.bombers.size():
		var info: Dictionary = Match.bombers[i]
		var bomber: Bomber = bomber_scene.instantiate()
		bomber.arena = arena
		bomber.index = i
		bomber.color = info.color
		bomber.position = arena.cell_center(spawns[i])
		if info.controls == "":
			bomber.is_cpu = true
			var brain := CpuBrain.new()
			bomber.add_child(brain)
			brain.set_level(Settings.cpu_difficulty)
		else:
			bomber.controls = info.controls
		bomber.died.connect(_on_bomber_died)
		bomber.bomb_placed.connect($Sounds/Place.play)
		bomber.powered_up.connect(_on_bomber_powered_up)
		arena.actors.add_child(bomber)
		bombers.append(bomber)


func _spawn_monsters() -> void:
	var cells := arena.free_cells_away_from_spawns(5)
	cells.shuffle()
	for i in mini(MONSTER_COUNT, cells.size()):
		var monster: Monster = monster_scene.instantiate()
		monster.arena = arena
		monster.position = arena.cell_center(cells[i])
		arena.actors.add_child(monster)


func _on_bomber_died(bomber: Bomber) -> void:
	$Sounds/Death.play()
	shake(6.0)
	hud.mark_dead(bomber.index)
	# Wait a moment before deciding: if the last two bombers die in the
	# same blast, that's a draw, not a win for whoever died last.
	settle_timer.start()


func _on_settle_timer_timeout() -> void:
	var alive := bombers.filter(func(bomber: Bomber) -> bool: return bomber.alive)
	if alive.size() <= 1 and not round_over:
		_end_round(alive[0].index if alive.size() == 1 else -1)


func _end_round(winner: int) -> void:
	round_over = true
	round_timer.stop()
	sudden_death_timer.stop()
	# Freeze the arena: no more bombs, flames or deaths.
	arena.process_mode = Node.PROCESS_MODE_DISABLED
	pause_menu.set_process_unhandled_input(false)
	Match.finish_round(winner)
	$Sounds/RoundEnd.play()
	var champion := Match.match_winner()
	if champion >= 0:
		results.show_match(champion)
	else:
		results.show_round(winner)


func _on_round_timer_timeout() -> void:
	if not Settings.sudden_death:
		_end_round(-1) # Time's up: nobody wins.
		return
	hud.show_hurry()
	_closing_cells = arena.spiral_cells()
	sudden_death_timer.start()


func _on_sudden_death_timer_timeout() -> void:
	if _closing_cells.is_empty():
		sudden_death_timer.stop()
		return
	arena.drop_wall(_closing_cells.pop_front())


func _on_arena_exploded(_cells: Array[Vector2i]) -> void:
	$Sounds/Explosion.play()
	shake(2.0)


func _on_block_destroyed(cell: Vector2i) -> void:
	var debris: CPUParticles2D = debris_scene.instantiate()
	debris.position = arena.cell_center(cell)
	arena.add_child(debris)


func _on_wall_dropped(_cell: Vector2i) -> void:
	$Sounds/Thud.play()
	shake(1.0)


func _on_bomber_powered_up(_kind: PowerUp.Kind) -> void:
	$Sounds/PowerUp.play()


func shake(strength: float) -> void:
	if _shake_tween:
		_shake_tween.kill()
	_shake_tween = create_tween()
	for i in 6:
		var offset := Vector2(randf_range(-strength, strength), randf_range(-strength, strength))
		_shake_tween.tween_property(camera, "offset", offset, 0.03)
	_shake_tween.tween_property(camera, "offset", Vector2.ZERO, 0.03)
```

```quiz
question: Why does `shake()` kill the previous tween before starting a new one?
options:
  - Godot only allows one tween per node
  - Two tweens animating the same offset would fight each other; restarting gives one clean shake
  - Killing tweens frees memory
answer: 1
```

```quiz
question: Why must the death animation be shorter than the settle timer?
options:
  - Tweens can't run longer than one second
  - When the round ends, the arena is disabled, which pauses tweens inside it; a longer animation would freeze halfway
  - The sound would be cut off
answer: 1
explain: The bomber is inside the arena. Its tween is bound to it, and bound tweens stop while their node can't process.
```
