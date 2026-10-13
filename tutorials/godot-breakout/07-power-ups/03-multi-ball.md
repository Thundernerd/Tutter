---
title: Multi-ball
description: Spawning extra balls, counting the ones still in play, and a lambda.
estimatedMinutes: 15
---

Because balls were spawned from code from the start, multi-ball is mostly "spawn two more". The interesting part is everything that assumed there was only one ball.

## Splitting

```gdscript title="game.gd" ins={7,12-26} del={6}
func _on_pickup_collected(kind: Pickup.Kind) -> void:
	match kind:
		Pickup.Kind.WIDE:
			paddle.widen(wide_duration)
		Pickup.Kind.MULTI:
			pass # Next page.
			_split_ball()
		Pickup.Kind.SLOW:
			slow_timer.start(slow_duration)
			for ball in balls.get_children():
				ball.speed_scale = SLOW_SCALE


## Two extra balls fly off from the first ball in play.
func _split_ball() -> void:
	var live := _live_balls()
	if live.is_empty():
		return
	var source: CharacterBody2D = live[0]
	source.launch() # In case it's still waiting on the paddle.
	for angle in [-30.0, 30.0]:
		var ball := _spawn_ball()
		ball.global_position = source.global_position
		ball.speed = source.speed
		ball.speed_scale = source.speed_scale
		ball.velocity = Vector2.UP.rotated(deg_to_rad(angle)) * ball.speed
```

The new balls start where the old one is, at its current speed (and slowness), flying up and out at 30° to either side. If the ball was still sitting on the paddle when the capsule landed, it's launched first. That can happen when you lose a life while a capsule is still falling.

## Which balls are still in play?

When a ball falls into the kill zone, it's `queue_free`d: deleted at the *end* of the frame. Until then it's still a child of `Balls`. So "how many balls are left?" has to skip balls that are on their way out:

```gdscript title="game.gd"
## Balls still in play. A ball that fell out stays a child until the end of the frame.
func _live_balls() -> Array:
	return balls.get_children().filter(func(ball: Node) -> bool: return not ball.is_queued_for_deletion())
```

`filter` keeps the elements for which a function returns `true`. The function is written right there, inline, as a **lambda**: `func(ball: Node) -> bool: return ...` is a function without a name.

## Only the last ball costs a life

```gdscript title="game.gd" ins={3-4}
func _on_kill_zone_body_entered(body: Node2D) -> void:
	body.queue_free()
	if not _live_balls().is_empty():
		return # Multi-ball: keep playing while any ball is left.
	lives -= 1
	hud.update_lives(lives)
```

## Two balls, one brick

There's one more single-ball assumption, hiding in the brick. Two balls can hit the same brick in the same physics tick. The first hit destroys it (it's queued for deletion, but still there), and the second hit then emits `destroyed` a second time: double points, and `remaining` counts one brick too many, so the level could "clear" with a brick still standing. One line fixes it:

```gdscript title="brick.gd" ins={2-3}
func hit() -> void:
	if hit_points <= 0:
		return # Already destroyed by another ball this frame.
	if type.unbreakable:
```

Now catch an **M**. Three balls, three times the chaos, and you only lose a life when the last one drops.

```quiz
question: Two of three balls fall into the kill zone in the same frame. When the second one triggers `body_entered`, what does `_live_balls().size()` return?
options:
  - "3"
  - "2"
  - "1"
  - "0"
answer: 2
explain: Both fallen balls are still children (they're freed at the end of the frame), but both are queued for deletion, so only the third ball counts.
```

```quiz
question: 'What does `[1, 2, 3, 4].filter(func(n): return n % 2 == 0)` return?'
type: text
answer: ["[2, 4]", "[2,4]"]
```
