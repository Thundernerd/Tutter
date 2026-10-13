---
title: Wall kicks
description: When a rotation doesn't fit, try a few nearby positions, in a fixed order.
estimatedMinutes: 25
---

## The idea

When a rotated piece doesn't fit where it is, a **wall kick** tries shifting it a little (a cell left or right, or a row or two up or down) and accepts the first position that fits. With good kick rules, pieces turn next to walls, on the floor and into tight gaps, and the player never notices anything special happened.

The Super Rotation System defines, for every rotation of every piece, **five** positions to try in order. The first is always (0, 0): rotate in place. The other four depend on which state you rotate from and to. All pieces except `I` and `O` share one table; the `I` has its own, because it's longer; and the `O` never needs to kick, since it looks the same in every state.

## The tables

Here are the clockwise kicks, written as offsets in board cells. Add them to `tetromino.gd`, right after `SIZES`:

```gdscript title="tetromino.gd"
## Super Rotation System wall kicks for a clockwise turn, indexed by the
## rotation the piece turns *from*. Each turn tries these offsets in order.
## y points down in Godot, so these are the usual SRS tables with y flipped.
const KICKS_JLSTZ: Array = [
	[Vector2i(0, 0), Vector2i(-1, 0), Vector2i(-1, -1), Vector2i(0, 2), Vector2i(-1, 2)], # 0 -> 1
	[Vector2i(0, 0), Vector2i(1, 0), Vector2i(1, 1), Vector2i(0, -2), Vector2i(1, -2)], # 1 -> 2
	[Vector2i(0, 0), Vector2i(1, 0), Vector2i(1, -1), Vector2i(0, 2), Vector2i(1, 2)], # 2 -> 3
	[Vector2i(0, 0), Vector2i(-1, 0), Vector2i(-1, 1), Vector2i(0, -2), Vector2i(-1, -2)], # 3 -> 0
]
const KICKS_I: Array = [
	[Vector2i(0, 0), Vector2i(-2, 0), Vector2i(1, 0), Vector2i(-2, 1), Vector2i(1, -2)], # 0 -> 1
	[Vector2i(0, 0), Vector2i(-1, 0), Vector2i(2, 0), Vector2i(-1, -2), Vector2i(2, 1)], # 1 -> 2
	[Vector2i(0, 0), Vector2i(2, 0), Vector2i(-1, 0), Vector2i(2, -1), Vector2i(-1, 2)], # 2 -> 3
	[Vector2i(0, 0), Vector2i(1, 0), Vector2i(-2, 0), Vector2i(1, 2), Vector2i(-2, -1)], # 3 -> 0
]
```

:::warning[Copying kick tables from elsewhere]
Published SRS tables use maths coordinates, where positive y means **up**. Godot's y points **down**, so every y value here has the opposite sign. If you paste a table from the internet, flip the y values, or pieces will kick into the floor instead of out of it.
:::

You don't need to memorise these numbers (nobody does), but it helps to see the patterns: most kicks first try one column sideways, away from whatever is probably in the way, then combine that with a small step up or down. The two-row kicks are what let a T piece twist down into a slot under an overhang, the famous **T-spin**.

## Counter-clockwise for free

We only stored clockwise turns. Counter-clockwise ones follow from a neat property of SRS: turning back from state 1 to state 0 must exactly undo what 0 → 1 did, so its kicks are the **0 → 1 kicks with the signs flipped**. In general, the kicks for turning counter-clockwise *from* state `s` are the negated clockwise kicks from state `s − 1`.

Add a method to `tetromino.gd` after `rotated()` that returns the offsets to try:

```gdscript title="tetromino.gd"
## The offsets to try, in order, when turning this piece in `direction`.
func kicks(direction: int) -> Array[Vector2i]:
	var result: Array[Vector2i] = []
	if type == Type.O:
		result.append(Vector2i.ZERO) # The O piece looks the same in every rotation.
		return result
	var table: Array = KICKS_I if type == Type.I else KICKS_JLSTZ
	if direction == 1:
		result.assign(table[rotation])
	else:
		# A counter-clockwise turn undoes the clockwise turn into this rotation,
		# so it uses that turn's offsets, reversed.
		for kick: Vector2i in table[wrapi(rotation - 1, 0, 4)]:
			result.append(-kick)
	return result
```

`-kick` negates both parts of the vector, and `-(0, 0)` is still `(0, 0)`, so "rotate in place" stays the first thing we try.

## Kicking in the game

Now `_rotate()` tries every offset in order and takes the first one that fits:

```gdscript title="game.gd" ins={2,7-11} del={1,5-6}
## Turn the piece if it fits in its new rotation.
## Turn the piece, trying each wall kick in turn until one fits.
func _rotate(direction: int) -> void:
	var turned := piece.rotated(direction)
	if board.fits(turned):
		_set_piece(turned)
	for kick in piece.kicks(direction):
		var kicked := turned.moved(kick)
		if board.fits(kicked):
			_set_piece(kicked)
			return
```

If no offset fits, the loop ends without changing anything and the rotation simply doesn't happen. Note we ask the *original* piece for its kicks: they depend on the state we're turning **from**.

## Walking through a kick

Back to the upright `I` against the right wall, in state 1. Turning clockwise to state 2 uses the `I`'s `1 -> 2` row:

| Try | Offset | Cells (columns) | Result |
| --- | --- | --- | --- |
| 1 | (0, 0) | 7, 8, 9, **10** | column 10 is outside the wall |
| 2 | (−1, 0) | 6, 7, 8, 9 | fits: done |

The piece lies down one column further left than you might expect, and play continues. Run the game and try it, then try turning pieces on the floor, between two stacks, and into gaps under overhangs.

:::tip[Testing kicks]
The quickest way to test rotation rules is in code: put blocks in `board.rows`, place a piece with `Tetromino.new(type, rotation, position)`, call `_rotate()` and check where it ended up. That's how this tutorial's game was tested, for example with the case above and with a T turning off the left wall.
:::

```quiz
question: A J piece in state 2 turns counter-clockwise. Which kicks does it try?
options:
  - The clockwise kicks from state 2, as they are
  - The clockwise kicks from state 1, negated
  - The clockwise kicks from state 3, negated
answer: 1
explain: Counter-clockwise from 2 lands on 1, which undoes the clockwise turn 1 → 2. So it uses the 1 → 2 kicks with their signs flipped.
```

```quiz
question: Why do our kick tables have the opposite y signs from most published SRS tables?
options:
  - Godot's 2D y axis points down
  - Our board is upside down
  - Godot rotates counter-clockwise by default
answer: 0
```

```quiz
question: Which piece never kicks?
type: text
answer: ["O", "O piece", "the O", "the O piece"]
explain: The O looks the same in all four states, so rotating it in place always fits.
```
