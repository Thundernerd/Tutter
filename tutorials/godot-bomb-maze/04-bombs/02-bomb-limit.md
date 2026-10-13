---
title: The bomb limit
description: Each bomber carries a limited number of bombs and gets them back when they explode.
estimatedMinutes: 10
---

Right now you can carpet the arena with bombs. In the genre, every bomber starts with **one** bomb and gets it back when it explodes. Power-ups (in a later chapter) raise the limit and the blast size, so both become stats on the bomber:

```gdscript title="bomber.gd" ins={1,6-8}
signal bomb_placed

# ...

var input_direction := Vector2.ZERO
var max_bombs := 1
var power := 2
var active_bombs := 0
```

Then place bombs through a check, and count them back in:

```gdscript title="bomber.gd"
func can_place_bomb() -> bool:
	return active_bombs < max_bombs


func place_bomb() -> void:
	if not can_place_bomb():
		return
	var bomb := arena.place_bomb(arena.cell_at(position), power)
	if bomb == null:
		return # Already a bomb here.
	active_bombs += 1
	bomb.exploded.connect(_on_bomb_exploded)
	bomb_placed.emit()


func _on_bomb_exploded(_bomb: Bomb) -> void:
	active_bombs -= 1
```

- `power` is the blast reach in cells; the bomb gets it from the bomber who placed it, so a power-up only affects *your* bombs.
- `arena.place_bomb` returns `null` when the cell already has a bomb. Without that check, standing still and mashing the key would count bombs that were never placed, and you'd lose them for good.
- Each bomb's `exploded` signal is connected to *the bomber that placed it*. When it goes off, that bomber gets its bomb back, even if it's on the other side of the arena by then.
- `bomb_placed` doesn't do anything yet. We'll hang a sound on it in the polish chapter, without the bomber knowing.

`can_place_bomb()` is its own method because the CPU will ask the same question before deciding to bomb.

Run it: one bomb at a time, and a new one only after the old one is gone.

```quiz
question: A bomber with `max_bombs = 2` has two bombs ticking. One explodes. What is `active_bombs` now, and can it place another?
options:
  - 1, yes
  - 2, no
  - 0, yes
  - 1, no
answer: 0
explain: The exploded bomb's signal runs `_on_bomb_exploded`, which decrements `active_bombs` to 1. 1 < 2, so it can place again.
```
