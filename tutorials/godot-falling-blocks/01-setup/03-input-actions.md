---
title: Input actions
description: Name every control once, so code never has to care which key it is.
estimatedMinutes: 10
---

Code could check for the <kbd>←</kbd> key directly, but then letting players rebind keys (which we add in the options chapter) would mean changing code. Instead, Godot lets you define **input actions**: named controls like `move_left` that one or more keys map to. The game only ever asks "is `move_left` pressed?".

## Add the actions

Open **Project → Project Settings → Input Map**. Type a name in **Add New Action**, press **Add**, then click the **+** next to the action and press the key.

| Action | Key | Does |
| --- | --- | --- |
| `move_left` | <kbd>←</kbd> | Move the piece one column left (repeats while held) |
| `move_right` | <kbd>→</kbd> | Move one column right |
| `soft_drop` | <kbd>↓</kbd> | Fall faster while held |
| `hard_drop` | <kbd>Space</kbd> | Drop to the bottom and lock instantly |
| `rotate_cw` | <kbd>↑</kbd> | Rotate clockwise |
| `rotate_ccw` | <kbd>Z</kbd> | Rotate counter-clockwise |
| `hold` | <kbd>C</kbd> | Put the piece aside for later |
| `pause` | <kbd>Esc</kbd> and <kbd>P</kbd> | Open the pause menu |

These are the controls most modern falling blocks games use, so players coming from other games feel at home. Every action gets one key, except `pause`, which gets two. The options screen will let players change the first seven.

:::tip[Physical keys]
In the key dialog, choose **Physical Keycode**. Physical keys refer to a *position* on the keyboard rather than the letter printed on it. On a German keyboard, the key in the <kbd>Z</kbd> position is labelled <kbd>Y</kbd>; with a physical keycode, rotation stays next to hold either way.
:::

## Reading actions in code

There are two ways to ask about an action, and this game uses both:

```gdscript
# Polling: "is it held right now?" Good for things that last, like soft drop.
Input.is_action_pressed("soft_drop")

# Events: "did this key event just press it?" Good for one-off actions, like rotating.
func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("rotate_cw"):
		print("rotate!")
```

A rotation should happen exactly once per key press, no matter how long you hold the key, so it's handled as an event. Soft drop lasts as long as the key is held, so we poll it every frame. Sideways movement is a mix of both, and gets a page of its own in the quality of life chapter.

```quiz
question: Why do we define input actions instead of checking keys directly?
options:
  - Actions are faster to check
  - Actions can be rebound without changing any game code
  - Godot can't read individual keys
answer: 1
explain: The game asks about `move_left`; which key that is lives in the Input Map, which the options screen can change at runtime.
```

```quiz
question: Which way of reading input fits **rotate clockwise** best?
options:
  - Polling `Input.is_action_pressed` every frame
  - Reacting to a pressed event in `_unhandled_input`
answer: 1
explain: Polling would rotate the piece every single frame while the key is held. A pressed event fires once per press.
```

## Checkpoint

If something doesn't work, compare your project with the reference: [Project at the end of chapter 1](./files/blockfall-ch1-end.zip).

Next up: [the playfield](../02-playfield/01-grid-as-data.md).
