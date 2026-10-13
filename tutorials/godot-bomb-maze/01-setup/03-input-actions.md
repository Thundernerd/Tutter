---
title: Controls for two players
description: Eleven input actions, so both players and the menus can be rebound later.
estimatedMinutes: 10
---

Two people share one keyboard, so each player gets their own set of **input actions**: named controls such as `p1_up` that keys are mapped to. Game code only ever asks about actions, never about keys. That's what makes the key rebinding in the options chapter possible without touching the gameplay code.

## Add the actions

Open **Project → Project Settings → Input Map**. Type each name in **Add New Action**, press **Add**, then click the **+** next to the action and press the key.

| Action | Key | Action | Key |
| --- | --- | --- | --- |
| `p1_up` | <kbd>W</kbd> | `p2_up` | <kbd>↑</kbd> |
| `p1_down` | <kbd>S</kbd> | `p2_down` | <kbd>↓</kbd> |
| `p1_left` | <kbd>A</kbd> | `p2_left` | <kbd>←</kbd> |
| `p1_right` | <kbd>D</kbd> | `p2_right` | <kbd>→</kbd> |
| `p1_bomb` | <kbd>Space</kbd> | `p2_bomb` | <kbd>Enter</kbd> |

Add one more, `pause`, with both <kbd>Esc</kbd> and <kbd>P</kbd>.

:::tip[Physical keys]
In the key dialog, pick **Physical Keycode**. A physical key is a *position* on the keyboard, so WASD stays under the left hand on AZERTY and Dvorak layouts too.
:::

The names follow a pattern on purpose: `p1_` or `p2_`, then the control. A bomber only needs to know its prefix, and can build the action names itself:

```gdscript
var controls := "p1"
Input.is_action_pressed(controls + "_up")        # p1_up
Input.is_action_just_pressed(controls + "_bomb") # p1_bomb, only on the frame it's pressed
```

## Why four actions instead of a vector?

Godot has `Input.get_vector()`, which turns four actions into one direction, diagonals included. Free-roaming games love it. A grid game doesn't: bombers walk along corridors, one axis at a time, and when two keys are held we have to *choose* one. We'll write that choice ourselves in the player chapter ("the most recently pressed key wins"), so we keep the four directions as separate actions.

:::note[Space and Enter]
Both bomb keys also activate whichever menu button has focus (that's Godot's built-in `ui_accept` action). It doesn't matter during play, but when a match ends while someone is still hammering their bomb key, it could press a button on the results screen. We'll guard against that when we build the results screen.
:::

```quiz
question: A bomber has `controls = "p2"`. Which action does `Input.is_action_just_pressed(controls + "_bomb")` check?
type: text
answer: [p2_bomb, '"p2_bomb"']
explain: String concatenation builds the action name `p2_bomb`, which is mapped to Enter.
```

```quiz
question: Why does a grid game avoid `Input.get_vector()` for movement?
options:
  - It's slower than reading four actions
  - It returns diagonals, but bombers move along one axis at a time
  - It doesn't support physical keys
answer: 1
explain: '`get_vector` happily returns (0.7, 0.7) for a diagonal. On a grid we need exactly one direction, so we pick it ourselves.'
```

## Checkpoint

That's the project set up. Compare yours with the reference if anything behaves differently: [Project at the end of chapter 1](./files/blast-grid-ch1-end.zip).

Next up: [tiles and the TileSet](../02-arena/01-tiles-and-tileset.md).
