---
title: Creating the project
description: Configure the window, create a UI theme, and add the game scene.
estimatedMinutes: 10
---

## Create the project

In the project manager, click **Create** and name the project `Minesweeper`. Pick the **Compatibility** renderer: a grid of squares doesn't need anything fancier, and Compatibility also runs in web browsers, which matters when we export at the end.

## Set the window size

Open **Project → Project Settings → Display → Window**. Turn on **Advanced Settings** (top right) to see every option, then set:

| Setting | Value | Why |
| --- | --- | --- |
| Viewport Width / Height | `640` × `360` | The game's logical resolution; all positions and sizes in this tutorial use it. |
| Window Width / Height Override | `1280` × `720` | Opens a bigger window on desktop. |
| Stretch → Mode | `canvas_items` | Scales the 640×360 game to fit the window. |

Godot stores these in `project.godot`, a plain text file you can read:

```ini title="project.godot" {2-3,6}
[display]
window/size/viewport_width=640
window/size/viewport_height=360
window/size/window_width_override=1280
window/size/window_height_override=720
window/stretch/mode="canvas_items"
```

:::warning[Stretch mode]
Without `canvas_items`, resizing or going fullscreen shows the game tiny in a corner. We add a fullscreen option later, so set it now.
:::

640×360 may sound small for a game that is basically a big grid. In the difficulties chapter we'll do the maths: the largest standard board (30×16) fits at exactly 20 pixels per cell, and because `canvas_items` renders text and shapes at the *window's* resolution, those cells are 40 crisp pixels on a 1280×720 window.

While you're in Project Settings, open **Rendering → Environment** and set **Default Clear Color** to a dark blue-black (`#10121a`). That's the background colour of the whole game.

:::note[No collision layers this time]
Physics games name their collision layers early on. Minesweeper has nothing that collides, so there's nothing to set up there.
:::

## A project theme

Almost everything on screen in this game is UI: buttons, labels, the board's numbers. Godot's default UI text is tiny at 640×360, so rather than overriding the font size on every control, create a **Theme**:

1. In the FileSystem dock, right-click → **New → Resource…**, choose **Theme**, and save it as `theme.tres`.
2. Select it. In the Inspector, set **Default Font Size** to `14`.
3. In **Project Settings → GUI → Theme → Custom**, pick `theme.tres`.

Every `Control` in the game now uses it, and individual nodes (like a big title) can still override it. Our custom-drawn board will also borrow the theme's font for its numbers. The file is tiny:

```ini title="theme.tres"
[gd_resource type="Theme" format=3]

[resource]
default_font_size = 14
```

We'll come back to the theme in the HUD chapter to give the counters a digital-clock look.

## The game scene

Click **Other Node** in the Scene dock, pick a plain `Node`, rename it to `Game` and save it as `game.tscn`.

Why a `Node` and not a `Node2D`? The game scene doesn't need a position of its own: it's a conductor that creates the board and listens to it. The things you *see* will be `Control` nodes that position themselves.

Press <kbd>F5</kbd> and choose **Select Current** when Godot asks for a main scene. You should get an empty dark window.

```quiz
question: Which settings belong in `project.godot`? Select all that apply.
type: multiple
options:
  - Viewport width and height
  - The main scene
  - The project-wide theme
  - The position of every node
answer: [0, 1, 2]
explain: Node positions live in the scene files (`.tscn`). The theme *setting* lives in `project.godot`; the theme itself is its own resource file, `theme.tres`.
```

```quiz
question: Why create a theme instead of setting the font size on each control?
options:
  - Themes render text faster
  - One change in the theme applies to every control in the project
  - Controls can't override font sizes
answer: 1
explain: A theme is shared style. Every control inherits it, so the whole game stays consistent and is easy to restyle.
```

## Checkpoint

If something doesn't work, compare your project with the reference: [Project at the end of chapter 1](./files/minesweeper-ch1-end.zip).

Next up: [the data model behind the board](../02-the-board/01-data-model.md).
