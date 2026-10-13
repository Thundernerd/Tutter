---
title: Input actions
description: Name your controls once, use them everywhere.
estimatedMinutes: 10
---

Code could check for the <kbd>Space</kbd> key directly, but then rebinding keys (which we add in the options chapter) would mean changing code. Instead, Godot lets you define **input actions**: named controls like `shoot` that one or more keys map to.

## Add the actions

Open **Project → Project Settings → Input Map**. Type a name in **Add New Action**, press **Add**, then click the **+** next to the action and press the key.

| Action | Key |
| --- | --- |
| `move_left` | <kbd>←</kbd> |
| `move_right` | <kbd>→</kbd> |
| `shoot` | <kbd>Space</kbd> |
| `pause` | <kbd>Esc</kbd> and <kbd>P</kbd> |

:::tip[Physical keys]
In the key dialog, choose **Physical Keycode**. Physical keys refer to a *position* on the keyboard rather than the letter printed on it. It makes no difference for the arrows and Space, but when players rebind to letter keys, their choice stays put on AZERTY or Dvorak layouts too.
:::

## Reading actions in code

Three functions cover almost everything:

```gdscript
Input.is_action_pressed("shoot")             # held down right now?
Input.is_action_just_pressed("shoot")        # pressed this frame?
Input.get_axis("move_left", "move_right")    # -1 (left), 0, or 1 (right)
```

`get_axis` is perfect for the cannon: one call gives the direction, and pressing both keys cancels out to `0`. `is_action_just_pressed` is what we want for firing: holding <kbd>Space</kbd> down fires once, not every frame.

```quiz
question: The player holds Space for one second. How many frames does `Input.is_action_just_pressed("shoot")` return true?
options:
  - Every frame of that second
  - One: the frame the key went down
  - None until the key is released
answer: 1
explain: '"Just pressed" is true only on the frame the action changes from released to pressed. `is_action_pressed` is the one that stays true while the key is held.'
```

## Checkpoint

If something doesn't work, compare your project with the reference: [Project at the end of chapter 1](./files/space-invaders-ch1-end.zip). It includes the sprites.

Next up: [the player's ship](../02-player/01-ship-scene.md).
