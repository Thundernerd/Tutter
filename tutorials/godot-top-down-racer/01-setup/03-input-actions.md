---
title: Input actions
description: Named controls for two players, so keys can be rebound later.
estimatedMinutes: 10
---

Code could check for the <kbd>W</kbd> key directly, but then rebinding keys (which the options screen does later) would mean changing code. Instead, Godot has **input actions**: named controls like `p1_accelerate` that one or more keys map to. The car asks "is `p1_accelerate` held?" and never cares which key that is.

## Add the actions

Open **Project → Project Settings → Input Map**. Type a name in **Add New Action**, press **Add**, then click the **+** next to the action and press the key.

| Action | Key | | Action | Key |
| --- | --- | --- | --- | --- |
| `p1_accelerate` | <kbd>W</kbd> | | `p2_accelerate` | <kbd>↑</kbd> |
| `p1_brake` | <kbd>S</kbd> | | `p2_brake` | <kbd>↓</kbd> |
| `p1_left` | <kbd>A</kbd> | | `p2_left` | <kbd>←</kbd> |
| `p1_right` | <kbd>D</kbd> | | `p2_right` | <kbd>→</kbd> |
| `pause` | <kbd>Esc</kbd> and <kbd>P</kbd> | | | |

There's no separate reverse action: `brake` slows you down, and once you've stopped, holding it reverses. That's how most arcade racers work, and it keeps the controls to four keys per player.

:::tip[Physical keys]
In the key dialog, choose **Physical Keycode**. A physical key is a *position* on the keyboard, so WASD stays under your left hand on AZERTY or Dvorak layouts too. With two players sharing a keyboard, that matters even more.
:::

## Naming pattern

Notice the pattern: every player action is `<player>_<control>`. The car will store just the prefix (`"p1"` or `"p2"`) and build the action names from it:

```gdscript
var input_prefix := "p1"
Input.get_axis(input_prefix + "_brake", input_prefix + "_accelerate")
```

One car script then works for both players, and for CPU cars too (they simply don't read input).

## Reading actions

Three functions cover almost everything:

```gdscript
Input.is_action_pressed("p1_accelerate")   # held down right now?
Input.is_action_just_pressed("pause")      # pressed this frame?
Input.get_axis("p1_left", "p1_right")      # -1 (left), 0, or 1 (right)
```

`get_axis` returns the second action's strength minus the first's. Pressing both cancels out to `0`, and with a gamepad stick it returns anything in between.

```quiz
question: What does `Input.get_axis("p1_brake", "p1_accelerate")` return while only W is held?
options:
  - "-1"
  - "0"
  - "1"
answer: 2
explain: The first action is the negative side and the second is the positive side. W is `p1_accelerate`, the positive side, so the result is 1.
```

## Checkpoint

That's the setup done. If something doesn't work, compare with the reference project: [Project at the end of chapter 1](./files/tiny-racers-ch1-end.zip).

Next: [building the car](../02-the-car/01-car-scene.md).
