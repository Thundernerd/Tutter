---
title: Eating and growing
description: Growing is moving without dropping the tail.
estimatedMinutes: 10
---

## Growing for free

Remember the `grow` parameter of `move_to`? When the snake eats, it moves as usual but **keeps its tail** for that one move. The body gets one cell longer, and the new length sticks:

| Tick | What happens | body | Length |
| --- | --- | --- | --- |
| 0 | | (8, 10) (7, 10) (6, 10) | 3 |
| 1 | normal move | (9, 10) (8, 10) (7, 10) | 3 |
| 2 | eats at (10, 10), tail kept | (10, 10) (9, 10) (8, 10) (7, 10) | 4 |
| 3 | normal move | (11, 10) (10, 10) (9, 10) (8, 10) | 4 |

## The code

The snake eats when its next head lands on the food's cell. Update `game.gd`:

```gdscript title="game.gd" ins={3-4}
const START_CELL := Vector2i(8, 10)

var score := 0

@onready var snake: Snake = $Board/Snake
```

```gdscript title="game.gd" ins={4-13} del={3}
func _on_move_timer_timeout() -> void:
	var head := snake.next_head()
	snake.move_to(head, false)
	var eating := head == food.cell
	snake.move_to(head, eating)
	if eating:
		_eat()


func _eat() -> void:
	score += 1
	print("Score: ", score)
	_place_food()
```

- `head == food.cell` compares two cells and gives `true` or `false`, which we store in `eating`. Then that same value tells `move_to` whether to grow. Compact, and impossible to get out of sync.
- `_eat` adds a point and puts new food down. For now the score goes to the Output panel.

The order matters: the snake moves **first**, then the food is placed. `free_cells` then sees the new head and won't put food right under it.

Run it and go eat. The snake grows with every bite, and `Score: 1`, `Score: 2`... appear in the Output panel.

```quiz
type: text
question: A snake of length 3 eats 4 pieces of food. How long is it now?
answer: ["7", "seven"]
explain: Each piece of food skips one `pop_back`, so the snake ends up one cell longer per bite.
```
