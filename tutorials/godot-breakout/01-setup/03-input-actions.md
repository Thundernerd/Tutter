---
title: Input actions
description: Name the controls once, including a mouse button.
estimatedMinutes: 10
---

The game will ask "is *move left* held?" rather than "is the left arrow key held?". Those names are **input actions**, and keys or mouse buttons are mapped onto them. Code that only knows action names doesn't care which keys the player picks, which is exactly what we need for key rebinding later.

## Add the actions

Open **Project → Project Settings → Input Map**. Type each name into **Add New Action** and press **Add**. Then click the **+** next to the action to bind an event:

| Action | Events |
| --- | --- |
| `move_left` | <kbd>←</kbd> |
| `move_right` | <kbd>→</kbd> |
| `launch` | <kbd>Space</kbd>, Left Mouse Button |
| `pause` | <kbd>Esc</kbd>, <kbd>P</kbd> |

For a key, press it in the dialog. For the mouse button, open the **Mouse Buttons** section of the same dialog and choose **Left Mouse Button**.

:::tip[Physical keys]
In the key dialog, pick **Physical Keycode**. A physical key is a *position* on the keyboard rather than a letter, so if you rebind to WASD later, those keys stay under your left hand on AZERTY and Dvorak keyboards too.
:::

One action can have several events: <kbd>Space</kbd> and a left click both launch the ball, whichever control scheme the player prefers.

## Reading actions

Godot gives you a few ways to ask about an action:

```gdscript
Input.get_axis("move_left", "move_right")   # -1, 0 or 1: perfect for movement
Input.is_action_pressed("move_left")        # held right now?

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("launch"):    # this event *is* a launch press
		pass
```

The first two **poll**: you ask every frame. The last one reacts to **events** as they arrive, which suits one-off actions like launching or pausing. `_unhandled_input` only receives events that no button or other UI control has used, so clicking a menu button never launches a ball by accident.

```quiz
question: Which events should the `launch` action have so both control schemes can launch the ball? Select all that apply.
type: multiple
options:
  - Space
  - Left Mouse Button
  - Escape
  - The right arrow key
answer: [0, 1]
explain: Escape belongs to `pause`, and the right arrow already moves the paddle.
```

## Checkpoint

That's the setup done. Compare with the reference project if anything is off: [Project at the end of chapter 1](./files/breakout-ch1-end.zip).

Next up: [the paddle](../02-paddle/01-paddle-scene.md).
