---
title: Input actions
description: Name your controls once, use them everywhere.
estimatedMinutes: 10
---

Code could check for the <kbd>W</kbd> key directly, but then rebinding keys (which we add in the options chapter) would mean changing code. Instead, Godot lets you define **input actions**: named controls like `p1_up` that one or more keys map to.

## Add the actions

Open **Project → Project Settings → Input Map**. Type a name in **Add New Action**, press **Add**, then click the **+** next to the action and press the key.

| Action | Key |
| --- | --- |
| `p1_up` | <kbd>W</kbd> |
| `p1_down` | <kbd>S</kbd> |
| `p2_up` | <kbd>↑</kbd> |
| `p2_down` | <kbd>↓</kbd> |
| `pause` | <kbd>Esc</kbd> and <kbd>P</kbd> |

:::tip[Physical keys]
In the key dialog, choose **Physical Keycode**. Physical keys refer to a *position* on the keyboard, so WASD stays under your left hand on AZERTY or Dvorak layouts too.
:::

## Reading actions in code

Three functions cover almost everything:

```gdscript
Input.is_action_pressed("p1_up")      # held down right now?
Input.is_action_just_pressed("pause") # pressed this frame?
Input.get_axis("p1_up", "p1_down")    # -1 (up), 0, or 1 (down)
```

`get_axis` is perfect for paddles: one call gives the direction, and pressing both keys cancels out to `0`.

```quiz
question: What does `Input.get_axis("p1_up", "p1_down")` return while only S is held?
options:
  - "-1"
  - "0"
  - "1"
answer: 2
explain: The first action is the negative side and the second the positive side. In Godot 2D, positive y points **down**.
```
