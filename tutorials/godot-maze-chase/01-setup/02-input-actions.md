---
title: Input actions
description: Name the controls once and refer to them by name everywhere.
estimatedMinutes: 10
---

The player's code could check for the <kbd>↑</kbd> key directly, but then letting players rebind keys (which we add in the options chapter) would mean changing code. Godot's answer is **input actions**: named controls like `move_up` that one or more keys map to. Code asks about the action; the Input Map decides which keys trigger it.

## Add the actions

Open **Project → Project Settings → Input Map**. Type a name in **Add New Action**, press **Add**, then click the **+** next to the action and press the key.

| Action | Key |
| --- | --- |
| `move_up` | <kbd>↑</kbd> |
| `move_down` | <kbd>↓</kbd> |
| `move_left` | <kbd>←</kbd> |
| `move_right` | <kbd>→</kbd> |
| `pause` | <kbd>Esc</kbd> and <kbd>P</kbd> |

:::tip[Physical keys]
In the key dialog, choose **Physical Keycode**. Physical keys refer to a *position* on the keyboard rather than the letter printed on it. That doesn't matter for the arrow keys, but it does once a player rebinds to WASD on an AZERTY keyboard.
:::

The actions end up in `project.godot` too, in an `[input]` section. Each one is a small dictionary with a list of events; you'll rarely edit these by hand.

## Reading actions in code

Three functions cover almost everything:

```gdscript
Input.is_action_pressed("move_up")       # held down right now?
Input.is_action_just_pressed("move_up")  # pressed during this frame?
Input.get_vector("move_left", "move_right", "move_up", "move_down") # a Vector2 for analog movement
```

Maze Muncher uses `is_action_just_pressed`. The player doesn't move *while* you hold a key; it moves all the time, and a key press only says where to turn next. "Which key was pressed most recently" is exactly what `just_pressed` tells us.

```quiz
question: Why do we create input actions instead of checking for keys directly?
options:
  - Actions are faster to check than keys
  - Code refers to a name, so the keys behind it can change without touching the code
  - Godot can't read the arrow keys directly
answer: 1
explain: That separation is what makes key rebinding possible later on. The movement code never changes.
```

## Checkpoint

That's the whole setup. If something doesn't work, compare your project with the reference: [Project at the end of chapter 1](./files/maze-muncher-ch1-end.zip).

Next up: [drawing the maze](../02-maze/01-tileset.md).
