---
title: Eat animation
description: Tweens for food that pops in and a score that bumps.
estimatedMinutes: 15
---

A **tween** animates a property from code: "change `scale` to 1 over 0.3 seconds". Godot works out all the in-between values ("in-be-tween") and applies them every frame. Two small tweens make eating feel much better.

## Food that pops in

Right now new food simply appears. Let it grow from nothing instead, overshooting a little before it settles. In `food.gd`:

```gdscript title="food.gd" ins={4-5,10-16}
## The grid cell the food is in.
var cell := Vector2i.ZERO

var _tween: Tween


func place(new_cell: Vector2i) -> void:
	cell = new_cell
	position = Board.cell_center(cell)
	# Pop in: grow from nothing, overshooting a little before settling.
	if _tween:
		_tween.kill()
	scale = Vector2.ZERO
	_tween = create_tween()
	_tween.tween_property(self, "scale", Vector2.ONE, 0.3) \
			.set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
```

- `create_tween()` makes a new tween that runs on this node. `tween_property(object, property, final value, seconds)` adds an animation step.
- The **transition** decides the shape of the motion. `TRANS_BACK` overshoots the target and comes back, which reads as a little "pop". `EASE_OUT` applies that at the end of the animation.
- If the snake eats the new food within 0.3 seconds (it happens at high speed!), a new pop starts while the old one is still running. `kill()` stops the old tween first so the two don't fight over `scale`.
- The `\` at the end of a line continues the statement on the next line.

Remember why the food draws around its own (0, 0)? Scaling happens around a node's origin, so the apple grows from the centre of its cell. Had we drawn it from the top-left corner, it would grow out of the corner instead.

A few transitions to try:

| Transition | Feels like |
| --- | --- |
| `TRANS_LINEAR` | Constant speed, mechanical |
| `TRANS_SINE` | Smooth and gentle |
| `TRANS_BACK` | Overshoots, then settles: a pop |
| `TRANS_ELASTIC` | Wobbles like jelly |
| `TRANS_BOUNCE` | Bounces like a dropped ball |

## A score that bumps

Make the score label jump for a moment when it changes. In `hud.gd`:

```gdscript title="hud.gd" ins={4-11}
func update_score(score: int) -> void:
	score_label.text = "Score: %d" % score
	best_label.text = "Best: %d" % maxi(score, HighScore.best)
	if score > 0:
		_pulse(score_label)


## Briefly enlarge a label, then shrink it back.
func _pulse(label: Label) -> void:
	label.scale = Vector2(1.4, 1.4)
	create_tween().tween_property(label, "scale", Vector2.ONE, 0.2)
```

A control scales around its **Pivot Offset**, which is its top-left corner by default. Select `ScoreLabel` in `hud.tscn` and set **Layout → Transform → Pivot Offset** to (0, 11): the left edge, halfway down. The text then grows to the right and evenly up and down, staying anchored to the board's edge.

The `score > 0` check skips the bump when the game starts at 0; there's nothing to celebrate yet.

Play and eat: the food pops in at every new spot, and the score bumps with every point.

```quiz
question: Why does `place` call `_tween.kill()` before starting a new tween?
options:
  - Tweens can only run once per game
  - So an unfinished pop-in animation doesn't keep changing `scale` while the new one runs
  - To free memory
answer: 1
explain: Two tweens animating the same property at once would fight each other. Killing the old one leaves the new one in charge.
```
