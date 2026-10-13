---
title: Tweens
description: Fade in the result screen, then make revealed cells pop open in a ripple.
estimatedMinutes: 25
---

A **tween** animates a value over time from code: "take this property from here to there in 0.3 seconds". Godot's tweens are created with `create_tween()` and run by themselves; you don't write any per-frame code.

## A simple one first: fading in

The result screen currently appears instantly. A quick fade is softer. Because everything on that screen is a child of `Dim`, fading `Dim` fades it all: a node's `modulate` colour multiplies its children's colours too.

```gdscript title="result_screen.gd" ins={4,12-13}
extends CanvasLayer
## Shown a moment after the game ends: the result, the time, and what to do next.

@onready var dim: ColorRect = $Dim
@onready var title_label: Label = %TitleLabel

# ...

func _open() -> void:
	show()
	play_again_button.grab_focus()
	dim.modulate.a = 0.0
	create_tween().tween_property(dim, "modulate:a", 1.0, 0.3)
```

`tween_property(object, property, final_value, duration)` is the workhorse. The property path `"modulate:a"` reaches *into* the colour and animates only its alpha. We set it to 0 first, so the tween has somewhere to start from.

## The ripple

Now something more interesting. When a flood fill opens a region, the cells should pop open one after another, spreading out from your click like a ripple in water. And when you lose, the hidden mines should pop up one by one, spreading out from the one that exploded.

Remember the order the queue revealed cells in? Rings around the click. Even simpler: each cell's delay can be its **distance** from the click.

```text
delay = distance from the click × 0.03 s
```

Each cell then takes 0.15 s to open. A cell 10 cells away starts 0.3 s after the click; even a ripple from one corner of an expert board to the other is over in about a second.

### One clock for every cell

We could create one tween per cell, but a big flood fill opens hundreds of cells, and the board draws everything in a single `_draw()` anyway. Instead, the board keeps one number, `_anim_clock`, and a single tween moves it forward. Each animating cell remembers the clock time at which its own animation starts. When drawing, a cell's progress is:

```text
progress = (clock − cell's start time) / 0.15, clamped between 0 and 1
```

0 means "hasn't started" (still looks covered), 1 means "fully open".

### The code

Add the constants and variables to `board.gd`:

```gdscript title="board.gd"
## How long one cell takes to pop open, and the extra delay per cell of distance.
const REVEAL_TIME := 0.15
const RIPPLE_DELAY := 0.03

var _anim_clock := 0.0
## Cell → the value of _anim_clock at which its reveal animation starts.
var _anim_start: Dictionary[Vector2i, float] = {}
var _anim_tween: Tween
```

Then the animation itself, in its own section before the drawing code:

```gdscript title="board.gd"
# --- Animation -------------------------------------------------------------

## Pop cells open in a ripple that spreads out from `origin`.
func _animate(cells: Array[Vector2i], origin: Vector2i) -> void:
	var end := _anim_clock
	for pos in cells:
		var start := _anim_clock + Vector2(pos - origin).length() * RIPPLE_DELAY
		_anim_start[pos] = start
		end = maxf(end, start + REVEAL_TIME)
	if _anim_tween:
		_anim_tween.kill()
	_anim_tween = create_tween()
	_anim_tween.tween_method(_set_anim_clock, _anim_clock, end, end - _anim_clock)


func _set_anim_clock(value: float) -> void:
	_anim_clock = value
	queue_redraw()


## 0 when a cell's animation hasn't started, 1 when it's done (or it never had one).
func _anim_progress(pos: Vector2i) -> float:
	if not _anim_start.has(pos):
		return 1.0
	return clampf((_anim_clock - _anim_start[pos]) / REVEAL_TIME, 0.0, 1.0)
```

- **`Vector2(pos - origin).length()`** is the straight-line distance in cells. It's converted to `Vector2` first because `length()` returns a fractional distance.
- **`tween_method(method, from, to, duration)`** calls a method every frame with a value moving from `from` to `to`. Ours stores the clock and asks for a redraw. That's how one tween drives hundreds of cells.
- **Overlapping animations** work out naturally: if you click again while a ripple is still running, the old tween is killed and a new one continues from the current clock value to the new end. Cells from the first ripple keep their start times and finish on schedule.
- **`_anim_start` never needs clearing.** Once the clock has passed a cell's start time plus `REVEAL_TIME`, its progress is 1 forever. And when the game restarts, the whole board is rebuilt anyway.

Start the animations in `_reveal`. The second call makes the hidden mines ripple out from the explosion:

```gdscript title="board.gd" ins={1,4}
	_animate(revealed, pos)
	match model.state:
		BoardModel.GameState.LOST:
			_animate(_hidden_mines(), model.exploded)
			game_lost.emit(model.exploded)
```

`_hidden_mines` collects the mines the player never saw. Add it after `_toggle_flag`:

```gdscript title="board.gd"
## Mines the player never saw; they pop open one by one when the game is lost.
func _hidden_mines() -> Array[Vector2i]:
	var mines: Array[Vector2i] = []
	for y in model.height:
		for x in model.width:
			var cell := model.get_cell(Vector2i(x, y))
			if cell.is_mine and cell.can_reveal():
				mines.append(Vector2i(x, y))
	return mines
```

### Drawing the animation

The trick for drawing: a face-up cell is drawn normally, and then, while its animation runs, a **shrinking cover** is drawn on top. At progress 0 the cover hides the whole cell; at 1 it has shrunk to nothing.

```gdscript title="board.gd" ins={5-8}
	if cell.is_mine:
		_draw_mine(rect)
	elif cell.adjacent > 0:
		_draw_text(rect, str(cell.adjacent), NUMBER_COLORS[cell.adjacent])
	# While animating, a shrinking cover sits on top of the revealed cell.
	var progress := _anim_progress(pos)
	if progress < 1.0:
		_draw_covered(rect.grow(-rect.size.x * 0.5 * progress))
```

`grow` with a negative amount shrinks a rectangle from all sides towards its centre; shrinking by half its width makes it vanish. `_draw_covered` already draws a cover into any rectangle, so the animation reuses it.

## Logic doesn't wait for animation

Notice what *didn't* change: the model. When you click, the model reveals every cell instantly, the win check runs instantly, and the signals fire instantly. The animation is purely cosmetic, running behind the real state.

That's deliberate. If the rules waited for animations, every animation bug would become a gameplay bug, and fast players would be held up by effects. Here, you can click again mid-ripple and everything stays correct.

Run it, and open a big region on an expert board. Then lose on purpose and watch the mines rise out from the explosion.

```quiz
question: What does the property path `"modulate:a"` animate?
options:
  - The whole modulate colour
  - Only the alpha (opacity) component of modulate
  - The node's position
answer: 1
explain: A colon in a property path reaches into a sub-property. `modulate:a` is the alpha of the modulate colour.
```

```quiz
question: Why does one tween drive the whole ripple instead of one tween per cell?
options:
  - Godot only allows one tween per node
  - The board draws everything in one `_draw()`, so one shared clock plus a start time per cell is simpler and cheaper than hundreds of tweens
  - Tweens can't animate cells
answer: 1
explain: '`tween_method` moves the clock; each cell works out its own progress from it while drawing.'
```

```quiz
question: With RIPPLE_DELAY = 0.03 and REVEAL_TIME = 0.15, when is a cell 10 cells from the click fully open?
type: text
answer: ["0.45", "0.45s", "0.45 s", ".45", "450ms", "450 ms"]
hint: Its animation starts after 10 × 0.03 seconds, then takes REVEAL_TIME.
explain: It starts at 0.3 s and takes 0.15 s, so it's fully open 0.45 s after the click.
```
