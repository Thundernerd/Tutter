---
title: The danger map
description: Predicting which cells will burn and when, chain reactions included.
estimatedMinutes: 20
---

Before a CPU can play well, it has to answer one question: **if I stand here, when will I burn?** The answer for the whole arena is a **danger map**: a dictionary from cell to the number of seconds until that cell catches fire.

- Cells already burning: `0.0`.
- Cells in the blast of a ticking bomb: that bomb's remaining fuse time.
- Cells that aren't in the dictionary at all: safe, for now.

## Chains make it tricky

Two bombs: A with 2.0 seconds left and B with 0.5 seconds left. B's blast reaches A.

```text
   x: 1    2    3    4    5    6    7
y=3   .    .    A    .    B    .    .
               2.0s      0.5s
```

Naively, A's cells look safe for two seconds. But when B goes off at 0.5 s, it sets off A, so *every* cell in A's blast also burns at 0.5 s. A CPU hiding in A's up arm, thinking it has two seconds, is toast.

So before filling in cells, the danger map works out when each bomb will really go off: a bomb inside another bomb's blast inherits the earlier time. A chain can be any length (B sets off A, which sets off C...), so we repeat until nothing changes.

## The code

It's arena knowledge, so it goes in the arena:

```gdscript title="arena.gd"
## Seconds until each threatened cell catches fire. Burning cells are 0.
## `extra_bombs` (cell -> power) lets the CPU try out a bomb before placing it.
func danger_map(extra_bombs: Dictionary[Vector2i, int] = {}) -> Dictionary[Vector2i, float]:
	var danger: Dictionary[Vector2i, float] = {}
	for explosion: Explosion in flames.get_children():
		for cell in explosion.cells:
			danger[cell] = 0.0
	# When each bomb goes off, and how far it reaches.
	var fuses: Dictionary[Vector2i, float] = {}
	var powers: Dictionary[Vector2i, int] = {}
	for cell in bombs:
		fuses[cell] = bombs[cell].fuse.time_left
		powers[cell] = bombs[cell].power
	for cell in extra_bombs:
		fuses[cell] = Bomb.FUSE_TIME
		powers[cell] = extra_bombs[cell]
	# Chain reactions: a bomb inside another bomb's blast goes off with it.
	# Repeat until nothing changes, because chains can be any length.
	var changed := true
	while changed:
		changed = false
		for cell in fuses:
			for target in blast_cells(cell, powers[cell]):
				if fuses.has(target) and fuses[target] > fuses[cell]:
					fuses[target] = fuses[cell]
					changed = true
	for cell in fuses:
		for target in blast_cells(cell, powers[cell]):
			danger[target] = minf(danger.get(target, INF), fuses[cell])
	return danger
```

- Burning cells come from the explosions in the `Flames` container: each `Explosion` keeps its `cells`.
- `fuses` and `powers` describe every bomb by cell, which lets us mix in **imaginary** bombs. `extra_bombs` is how the CPU asks "what if I dropped a bomb here?" without dropping one. Imaginary bombs get a full fuse.
- The `while changed` loop is the chain step. Each pass, every bomb lowers the fuse of any bomb it reaches. When a pass changes nothing, every chain has been followed to its end.
- Finally each bomb marks its blast, keeping the *smallest* time when blasts overlap. `danger.get(target, INF)` returns infinity for unmarked cells, so `minf` always picks the real time.

The map reuses `blast_cells`, the exact function real explosions use. Prediction and reality can't disagree about where fire goes.

:::note[Performance]
This looks expensive: loops inside loops, recalculating blasts. But an arena has at most a few dozen bombs and a blast is a few dozen cells, so it's well under a millisecond, even when every CPU builds a map several times a second.
:::

```quiz
question: Bomb A has 2.0 s left, bomb B 0.5 s, and B's blast reaches A. What does the danger map say for a cell only in A's blast?
options:
  - "2.0"
  - "0.5"
  - "2.5"
  - The cell isn't in the map
answer: 1
explain: B goes off at 0.5 s and sets off A, so A's whole blast burns at 0.5 s too.
```

```quiz
question: Why does `danger_map` take an `extra_bombs` parameter?
options:
  - To let the CPU check what would happen if it placed a bomb, before placing it
  - To count bombs that already exploded
  - To make the map faster
answer: 0
```
