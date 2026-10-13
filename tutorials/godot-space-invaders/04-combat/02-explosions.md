---
title: Explosions
description: A scene that removes itself, and connecting to custom signals.
estimatedMinutes: 10
---

When an invader dies it should leave a burst on screen for a moment. The invader itself is gone immediately (so it can't be hit twice or block the formation's edges), so the burst is a separate little scene.

## A scene with no script

New scene, `Sprite2D` root named `Explosion`, texture `sprites/invader_explosion.png`. Give it a `Timer` child with **Wait Time** `0.25`, **One Shot** on and **Autostart** on.

Now connect the timer's `timeout` signal to the `Explosion` node itself. In the connect dialog, click **Pick**, untick **Script Methods Only**, and choose `queue_free()`. The finished scene file shows the connection:

```ini title="explosion.tscn"
[node name="Timer" type="Timer" parent="."]
wait_time = 0.25
one_shot = true
autostart = true

[connection signal="timeout" from="Timer" to="." method="queue_free"]
```

The explosion appears, waits a quarter of a second and deletes itself, without a line of code. Signals can call any method, including built-in ones.

Save it as `explosion.tscn`.

## Spawning it

Open `game.tscn`, select `Formation`, and look at the **Node** dock → **Signals**: the `invader_killed` and `cleared` signals you declared in `formation.gd` are listed alongside the built-in ones. Connect `invader_killed` to `Game`, then update `game.gd`:

```gdscript title="game.gd" ins={3,13-14,17-20}
extends Node2D

const EXPLOSION_SCENE := preload("res://explosion.tscn")

@onready var formation: Node2D = $Formation


func _ready() -> void:
	formation.build(1)
	formation.start()


func _on_formation_invader_killed(invader: Invader) -> void:
	_spawn(EXPLOSION_SCENE, invader.global_position)


func _spawn(scene: PackedScene, at: Vector2) -> void:
	var node: Node2D = scene.instantiate()
	node.position = at
	add_child(node)
```

The explosion goes under `Game`, not under `Formation`, so it stays where the invader died instead of marching on. `_spawn` is generic on purpose: we'll reuse it for particles in the polish chapter.

The signal hands over the invader that died. It has already called `queue_free()`, but nodes are only deleted at the end of the frame, so reading its position here is safe.

```quiz
question: Why is the explosion a separate scene instead of an animation on the invader?
options:
  - Sprite2D can't be a child of Area2D
  - The invader is removed right away, so it stops counting for edges, speed and hits, while the explosion lingers
  - Explosions need their own physics layer
answer: 1
```
