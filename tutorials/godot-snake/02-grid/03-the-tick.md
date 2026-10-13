---
title: The tick
description: A Timer that keeps the beat, and your first signal.
estimatedMinutes: 15
---

## Frames and ticks

A game redraws the screen many times per second; each redraw is a **frame**. Godot can run code every frame in a function called `_process`, but the number of frames per second depends on the computer: 60 on one monitor, 144 on another. A snake that moved one cell per frame would be uncontrollably fast, and faster on better screens.

So Snake runs on its own clock instead. Every **tick**, the snake moves exactly one cell. Ticks happen at a steady rate we choose, whatever the frame rate:

| | How often | Used for |
| --- | --- | --- |
| Frame | 60–144+ times per second, depends on the screen | Drawing, animations |
| Tick | ~7 times per second, our choice | Moving the snake, game rules |

## A Timer node

A `Timer` node counts down and announces when it reaches zero. Add one to `Game` and name it `MoveTimer`. In the Inspector, set **Wait Time** to `0.15` seconds. Leave **One Shot** off (so it starts over after each countdown) and **Autostart** off (we'll start it from code).

```text
Game (Node2D)
├── Board (Node2D)
└── MoveTimer (Timer)   # Wait Time 0.15
```

## Signals

When the timer reaches zero, it emits a **signal** called `timeout`. A signal is a node announcing "this just happened!". Other nodes can **connect** a function to it, and Godot calls that function every time the signal is emitted. Buttons emit `pressed`, timers emit `timeout`, and later we'll make our own.

First, `Game` needs a script for the function to live in. Right-click `Game` → **Attach Script** → `game.gd`.

Then select `MoveTimer`, open the **Node** dock (next to the Inspector) → **Signals**, and double-click `timeout()`. Pick `Game` as the receiver and click **Connect**. Godot adds an empty function called `_on_move_timer_timeout` to `game.gd`, with a green arrow icon next to it in the margin to show it's connected. Fill in the script:

```gdscript title="game.gd"
extends Node2D

var ticks := 0

@onready var move_timer: Timer = $MoveTimer


func _ready() -> void:
	move_timer.start()


func _on_move_timer_timeout() -> void:
	ticks += 1
	print("Tick ", ticks)
```

- `var ticks := 0` declares a variable outside any function. It belongs to the node and keeps its value between function calls.
- `$MoveTimer` finds the child node named `MoveTimer`. `@onready` waits until the node tree is ready before looking it up; without it, the child might not exist yet. `: Timer` tells Godot what type of node to expect, which gives you autocompletion.
- `_ready()` is called by Godot once, when the node and its children have entered the game. It's the place for setup.
- `ticks += 1` is short for `ticks = ticks + 1`.
- `print` writes a line to the **Output** panel.

Run the game and watch the Output panel: `Tick 1`, `Tick 2`, `Tick 3`... about seven per second. That's the heartbeat the whole game will run on.

:::tip[Code or editor?]
You can also connect signals in code: `move_timer.timeout.connect(_on_move_timer_timeout)`. Both do the same thing. Editor connections are saved in the scene file; code connections are visible in the script. We'll use both.
:::

```quiz
question: With a Wait Time of 0.15 seconds, roughly how many ticks happen per second?
options:
  - "0.15"
  - "6.7"
  - "15"
  - "150"
answer: 1
explain: One tick every 0.15 seconds means 1 ÷ 0.15 ≈ 6.7 ticks per second.
```

```quiz
question: Why does the snake move on a Timer instead of once per frame in `_process`?
options:
  - Timers are faster than _process
  - The frame rate depends on the screen, a timer keeps the same pace everywhere
  - _process can't change positions
answer: 1
```
