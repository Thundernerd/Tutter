---
title: Input actions
description: Name your controls once, and use the names everywhere.
estimatedMinutes: 10
---

The snake is steered with the arrow keys. Code could check for the <kbd>↑</kbd> key directly, but then letting players choose their own keys (which we add in the options chapter) would mean changing code everywhere. Instead, Godot lets you define **input actions**: named controls like `move_up`, with one or more keys attached. The game only ever asks about `move_up`; which key that is can change at any time.

## Add the actions

Open **Project → Project Settings → Input Map**. Type a name in **Add New Action**, press **Add**, then click the **+** next to the new action and press the key you want.

| Action | Key |
| --- | --- |
| `move_up` | <kbd>↑</kbd> |
| `move_down` | <kbd>↓</kbd> |
| `move_left` | <kbd>←</kbd> |
| `move_right` | <kbd>→</kbd> |
| `pause` | <kbd>Esc</kbd> and <kbd>P</kbd> |

:::tip[Physical keys]
In the key dialog, choose **Physical Keycode**. A physical key means a *position* on the keyboard rather than the letter printed on it, so controls stay in the same place on AZERTY, QWERTZ or Dvorak keyboards.
:::

Prefer WASD? Add a second key to each move action. Later, the options screen lets players pick one key per action, which replaces whatever is set here.

## Two ways to read input

**Polling** asks "is this held down *right now*?", usually every frame:

```gdscript
if Input.is_action_pressed("move_up"):
	print("Up is held")
```

**Events** are messages Godot sends the moment something happens: a key goes down, a key goes up, the mouse moves. A node receives them in a function called `_unhandled_input`:

```gdscript
func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("move_up"):
		print("Up was pressed")
```

Polling is great for things you *hold*, like a paddle or a car. Snake cares about *presses*: each press is one turn, and a quick press between two moves must never get lost. So the snake will use events.

:::note[What's `_unhandled_input`?]
Functions starting with an underscore, like `_ready` or `_unhandled_input`, are ones Godot calls for you at the right moment. You never call them yourself; you just write them. "Unhandled" means the event wasn't already used by a menu button, so clicking a button won't also steer the snake.
:::

```quiz
question: You hold the up arrow for a whole second. How many times is `event.is_action_pressed("move_up")` true?
options:
  - Once, when the key goes down
  - About 60 times, once per frame
  - Several times, as the keyboard repeats the key
answer: 0
explain: Holding a key makes the keyboard send repeated "echo" events, but `is_action_pressed` ignores echoes unless you ask for them. Each real press counts once.
```

## Checkpoint

That's the setup done. If something doesn't work, compare with the reference project: [Project at the end of chapter 1](./files/snake-ch1-end.zip). Unzip it, then use **Import** in the project manager and pick its `project.godot`.

Next up: [the grid](../02-grid/01-cells-and-pixels.md).
