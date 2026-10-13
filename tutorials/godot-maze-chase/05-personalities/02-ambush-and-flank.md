---
title: The ambusher and the flanker
description: Aim ahead of the player, and team up with another ghost.
estimatedMinutes: 20
---

## Rosie, the ambusher

Ember comes from behind. Rosie tries to get **in front** of you: her target is four tiles ahead of the player, in the direction the player is facing.

```gdscript title="rosie.gd"
extends Ghost
## Rosie, the pink ghost: the ambusher. Aims four tiles ahead of the player.


func get_chase_target() -> Vector2i:
	return player.cell + player.facing * 4
```

This is where `facing` from chapter 3 earns its keep. `direction` is `ZERO` while the player waits at a wall, but `facing` still remembers which way it looks, so Rosie always has somewhere to aim.

With Ember behind you and Rosie aiming for where you're about to be, the two of them naturally pinch you from both sides. Neither knows the other exists.

:::tip[A trick for players]
Rosie only looks at where you *face*. Head straight towards her, and her target is behind her, so she often turns away at the next junction. Arcade players used this to shake her off.
:::

:::note[A famous bug]
In the arcade original, "four tiles ahead" while facing up also added four tiles to the *left*, because of an overflow in the machine's maths. We aim straight ahead, but now you know why old strategy guides describe her target as up-and-left.
:::

## Frost, the flanker

Frost is the clever one, and the only ghost that depends on another ghost's position. Its target is built in two steps:

1. Take a **pivot** two tiles ahead of the player.
2. Draw an arrow from **Ember** to the pivot, and **double** it. The end of the doubled arrow is the target.

```text
 E . . . . . . . . . . . .      E = Ember
 . . . . . . . . . . . . .      P = player, facing right
 . . . . P → ◆ . . . . . .      ◆ = pivot, 2 tiles ahead
 . . . . . . . . . . . . .      F = Frost's target: as far past the pivot
 . . . . . . . . . . . . F          as Ember is before it
```

When Ember is right behind you, Frost's target lands well in front of you, and the two close in from both sides. When Ember is far away, Frost's target swings far away too, and Frost wanders. That makes Frost the hardest ghost to predict.

```gdscript title="frost.gd"
extends Ghost
## Frost, the cyan ghost: the flanker. Teams up with Ember to box the player in.

## The ghost Frost works with. Set to Ember in the game scene.
@export var partner: Ghost


func get_chase_target() -> Vector2i:
	var pivot := player.cell + player.facing * 2
	# Double the arrow from Ember to the pivot: Frost ends up on the far side of the player.
	return pivot + (pivot - partner.cell)
```

`pivot - partner.cell` is the arrow from Ember to the pivot; adding it to the pivot again doubles it. Vector maths does all the work, in two lines.

Select `Frost` in `game.tscn` and assign `Ember` to the new **Partner** property. Exporting it, instead of hard-coding `$"../Ember"`, keeps the script independent of the scene tree: you could pair Frost with any ghost.

```quiz
question: The player is at (10, 20) facing left. Where does Rosie aim?
options:
  - (14, 20)
  - (6, 20)
  - (10, 16)
answer: 1
explain: Facing left is (-1, 0); four of those added to (10, 20) give (6, 20).
```

```quiz
question: The player is at (10, 20), facing up. Ember is at (8, 22). Where does Frost aim?
type: text
answer: ["(12, 14)", "12, 14", "(12,14)", "12,14"]
hint: The pivot is (10, 18). The arrow from Ember to the pivot is (2, -4).
explain: Pivot (10, 18) plus the arrow (2, -4) gives (12, 14).
```
