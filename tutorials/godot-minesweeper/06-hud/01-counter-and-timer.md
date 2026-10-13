---
title: Counter and timer
description: A HUD bar on a CanvasLayer, a theme type variation for digital displays, and a clock that starts on the first click.
estimatedMinutes: 25
---

## A theme type variation

The counters should look like old digital displays: red digits on a black panel. We could override the colour, font size and background on each label, but both labels need the same look, so it belongs in the theme.

A **type variation** is a named style that builds on an existing control type. We'll add one called `LcdLabel`, based on `Label`. Open `theme.tres` and, in the theme editor at the bottom of the screen:

1. Click the **+** next to the type list (**Add Type**), type `LcdLabel` and add it.
2. With `LcdLabel` selected, open the type's settings (the wrench icon) and set its **Base Type** to `Label`.
3. Add these items:

| Item | Name | Value |
| --- | --- | --- |
| Color | `font_color` | `#ff4040` |
| Font Size | `font_size` | `20` |
| StyleBox | `normal` | New `StyleBoxFlat`: background `#050508`, corner radius 3, content margin left/right 6 |

Any label can now opt in by setting **Theme Type Variation** to `LcdLabel`. Change the style once in the theme, and every LCD label follows. Here's the resulting file:

```ini title="theme.tres"
[gd_resource type="Theme" load_steps=2 format=3]

[sub_resource type="StyleBoxFlat" id="StyleBoxFlat_lcd"]
content_margin_left = 6.0
content_margin_right = 6.0
bg_color = Color(0.02, 0.02, 0.03, 1)
corner_radius_top_left = 3
corner_radius_top_right = 3
corner_radius_bottom_right = 3
corner_radius_bottom_left = 3

[resource]
default_font_size = 14
LcdLabel/base_type = &"Label"
LcdLabel/colors/font_color = Color(1, 0.25, 0.25, 1)
LcdLabel/font_sizes/font_size = 20
LcdLabel/styles/normal = SubResource("StyleBoxFlat_lcd")
```

## The HUD scene

The HUD sits on a `CanvasLayer`, which draws its children in screen space, on top of the game, independent of any camera. Create a new scene with a `CanvasLayer` root named `HUD` and save it as `hud.tscn`:

```text
HUD (CanvasLayer)
└── Bar (PanelContainer)              # Anchor preset: Top Wide, height 32
    └── HBoxContainer
        ├── MineCounter (Label, %)    # Theme Type Variation: LcdLabel, min width 56
        ├── LeftSpacer (Control)      # Horizontal: Expand
        ├── Smiley (Button, %)        # min size 28×28, Focus Mode: None
        ├── RightSpacer (Control)     # Horizontal: Expand
        └── TimeLabel (Label, %)      # Theme Type Variation: LcdLabel, min width 56
```

| Node | Settings |
| --- | --- |
| `Bar` | Anchor preset **Top Wide**, **Size** y `32`. Theme override **Styles → Panel**: new `StyleBoxFlat`, background `#1b1f2c`, content margins 8 left/right and 2 top/bottom. |
| `MineCounter`, `TimeLabel` | Text `010` and `000`, **Horizontal** and **Vertical Alignment** Center. |
| `LeftSpacer`, `RightSpacer` | **Container Sizing → Horizontal → Expand** on. |

Two empty spacers with **Expand** split the leftover width equally, and both labels have the same minimum width, so the smiley lands exactly in the middle. This is the standard container trick for "left, centre, right".

The `Smiley` button gets its face on the next page. Its **Focus Mode** is `None` so it never takes keyboard focus. Otherwise, after clicking it once, the arrow keys and <kbd>Space</kbd> would go to the button instead of to our board.

Attach a script to `HUD`:

```gdscript title="hud.gd"
extends CanvasLayer
## The bar at the top: mines left, the restart smiley, and the clock.

@onready var mine_counter: Label = %MineCounter
@onready var time_label: Label = %TimeLabel


func set_mines_left(count: int) -> void:
	mine_counter.text = "%03d" % clampi(count, -99, 999)


func set_time(seconds: float) -> void:
	time_label.text = "%03d" % mini(int(seconds), 999)
```

`"%03d" % 7` formats a number with at least three digits, padded with zeros: `007`. Negative numbers work too (`-01`), which happens when you place more flags than there are mines. The classic game allows that, so we do too. The clamps keep the text at three characters, and the clock stops at 999 seconds like the original.

The HUD only exposes methods. The game doesn't know or care that there are labels inside, so you could redesign the HUD completely without touching the game script.

## Make room for it

Instance `hud.tscn` in `game.tscn` (drag it onto `Game`). The board area currently fills the whole screen, so the board could slide under the bar. Select `BoardArea` and set its offsets:

| Offset | Value |
| --- | --- |
| Left | `4` |
| Top | `36` (32 for the bar + 4 of breathing room) |
| Right | `-4` |
| Bottom | `-4` |

With **Full Rect** anchors, offsets are distances from the screen edges, so the area is now the screen minus the bar and a small margin. That leaves 632×320 pixels for the board.

## The mine counter

The counter shows `mine_count - flags_placed`, which the model already calculates in `flags_left()`. The board needs to tell the game when that changes. Add a signal to `board.gd`:

```gdscript title="board.gd" ins={1}
signal flags_changed(flags_left: int)
signal game_won
signal game_lost(cell: Vector2i)
```

Emit it after a flag is toggled, and after a win (since winning auto-flags the remaining mines):

```gdscript title="board.gd" ins={5,14}
	match model.state:
		BoardModel.GameState.LOST:
			game_lost.emit(model.exploded)
		BoardModel.GameState.WON:
			flags_changed.emit(model.flags_left())
			game_won.emit()
	queue_redraw()


func _toggle_flag(pos: Vector2i) -> void:
	if pos == NO_CELL:
		return
	if model.toggle_flag(pos):
		flags_changed.emit(model.flags_left())
		queue_redraw()
```

## The clock

The timer starts on the first click, not when the board appears: you shouldn't lose seconds to reading the screen. The model's `READY` → `PLAYING` change is exactly that moment, so the clock simply runs while the state is `PLAYING`:

```gdscript title="game.gd" ins={2,5,8,14-15,18-21,27-28} del={1}
## Runs one game: creates the model and hands it to the board.
## Runs one game: builds the board, keeps time, and reacts to the board's signals.

var model: BoardModel
var elapsed := 0.0

@onready var board: Control = %Board
@onready var hud: CanvasLayer = $HUD


func _ready() -> void:
	model = BoardModel.new(9, 9, 10)
	board.setup(model, 32)
	hud.set_mines_left(model.flags_left())
	hud.set_time(0.0)


func _process(delta: float) -> void:
	if model.state == BoardModel.GameState.PLAYING:
		elapsed += delta
		hud.set_time(elapsed)


# ...restart code and the game_lost / game_won handlers, unchanged...


func _on_board_flags_changed(flags_left: int) -> void:
	hud.set_mines_left(flags_left)
```

Connect `Board`'s `flags_changed` signal to `Game` in the Node dock; that's where `_on_board_flags_changed` comes from.

`_process(delta)` runs every frame, and `delta` is the time since the previous frame in seconds. Adding them up gives the elapsed time with sub-second precision, which we'll want for best times later. When the game is won or lost, the state leaves `PLAYING` and the clock stops by itself.

:::note[Why not a Timer node?]
A `Timer` counts *down* and fires a signal when it reaches zero. You could use a one-second repeating timer and count the ticks, but you'd only know the time to the nearest second. For a stopwatch, adding up `delta` is simpler and more precise. It also pauses for free: when we add a pause menu, a paused game doesn't call `_process`.
:::

Run it. The counter drops as you flag, the clock starts on your first click and stops when the game ends.

```quiz
question: What does `"%03d" % 42` produce?
type: text
answer: ["042"]
explain: '`%03d` means an integer, at least three characters wide, padded with zeros.'
```

```quiz
question: Why do the two spacers in the HUD bar both have Horizontal → Expand turned on?
options:
  - So they share the free space equally, which centres the smiley
  - Spacers are invisible without it
  - So the labels can grow
answer: 0
explain: Expanding children split the leftover width. With equal-width labels on both sides, the middle child ends up exactly centred.
```

```quiz
question: Why does the clock only run while `model.state == PLAYING`?
options:
  - It starts at the first click (READY → PLAYING) and stops when the game is won or lost
  - _process only works in that state
  - To save battery
answer: 0
explain: The game state already marks exactly the moments the clock should start and stop. No extra flags needed.
```

```quiz
question: What is a theme type variation?
options:
  - A copy of the whole theme for one scene
  - A named style based on an existing control type, which controls opt into with Theme Type Variation
  - A different font for each language
answer: 1
explain: '`LcdLabel` extends `Label` in the theme. Any label that sets its Theme Type Variation to `LcdLabel` uses those styles.'
```
