---
title: Particles
description: Sparks in every blast and brick debris from destroyed blocks, with CPUParticles2D.
estimatedMinutes: 15
---

Two particle effects: sparks flying out of every explosion, and chunks of brick tumbling from every destroyed block.

:::note[CPU or GPU particles?]
Godot has `GPUParticles2D` and `CPUParticles2D`. GPU particles scale to many thousands, but for a dozen sparks the CPU version is simpler: all its settings sit directly in the Inspector (no separate process material), and it behaves the same on every renderer and in web exports.
:::

## Sparks

Open `explosion.tscn` and add a `CPUParticles2D` named `Sparks` as a child of `Explosion`:

| Property | Value | Why |
| --- | --- | --- |
| Amount | `16` | |
| Lifetime | `0.45` | Shorter than the 0.5 s explosion, which frees its children |
| One Shot | on | A single burst, not a fountain |
| Explosiveness | `1` | All particles at once |
| Direction → Spread | `180` | Every direction |
| Gravity | `(0, 0)` | Top-down: nothing falls |
| Initial Velocity | `60` – `140` | |
| Damping | `120` – `200` | Fast out, then they slow down |
| Scale → Amount | `1.5` – `3` | Small squares |
| Color → Color Ramp | yellow-white → transparent red | Fades out as they cool |

`Emitting` is on by default, so the burst fires as soon as the explosion enters the tree. There's no code to write.

## Brick debris

Debris needs to outlive the block, so it's a scene of its own. Create a scene whose root is a `CPUParticles2D` named `BlockDebris`:

| Property | Value |
| --- | --- |
| Amount / Lifetime | `12` / `0.6` |
| One Shot / Explosiveness | on / `1` |
| Emission Shape | Rectangle, extents `(8, 8)` |
| Direction / Spread | `(0, -1)` / `70` |
| Gravity | `(0, 400)` |
| Initial Velocity | `60` – `120` |
| Scale → Amount | `2` – `4` |
| Color → Color Ramp | brick orange → transparent dark brown |

This one *does* use gravity: chunks pop upwards and fall, which reads as "bits flying off" even in a top-down view.

When a one-shot emitter is done, it emits `finished`. Connect that signal to the node's own built-in `queue_free` method (in the connect dialog, pick `BlockDebris` as the receiver and type `queue_free` as the receiver method), so each burst cleans up after itself. Save it as `block_debris.tscn`.

Spawn one for every destroyed block:

```gdscript title="game.gd" ins={1,4}
@export var debris_scene: PackedScene

# In _ready:
	arena.block_destroyed.connect(_on_block_destroyed)


func _on_block_destroyed(cell: Vector2i) -> void:
	var debris: CPUParticles2D = debris_scene.instantiate()
	debris.position = arena.cell_center(cell)
	arena.add_child(debris)
```

The debris is added to the arena itself, so its `position` uses the arena's coordinates (the same rule as everything else on the grid), and as the arena's last child it draws on top.

```quiz
question: Why is the debris its own scene instead of a CPUParticles2D inside the explosion?
options:
  - Explosions can only have one particle emitter
  - Debris appears at each destroyed block, which is a different cell from the explosion's centre, and it lives longer than the flames
  - CPUParticles2D can't be a scene root
answer: 1
```

```quiz
question: How does a BlockDebris node get removed?
type: text
answer: [finished, "the finished signal", "finished signal", queue_free, "finished -> queue_free"]
hint: Which signal does a one-shot emitter send when it's done?
explain: Its `finished` signal is connected to its own `queue_free`.
```
