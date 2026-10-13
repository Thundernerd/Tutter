---
title: Creating the project
description: Configure the window and add the game scene.
estimatedMinutes: 10
---

## Create the project

In the project manager, click **Create** and name the project `Pong`. Pick the **Compatibility** renderer: Pong doesn't need anything fancier, and Compatibility also runs in web browsers, which matters when we export at the end.

## Set the window size

Open **Project → Project Settings → Display → Window**. Turn on **Advanced Settings** (top right) to see every option, then set:

| Setting | Value | Why |
| --- | --- | --- |
| Viewport Width / Height | `640` × `360` | The game's logical resolution; all positions in this tutorial use it. |
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

While you're in Project Settings, open **Rendering → Environment** and set **Default Clear Color** to a dark blue-black (`#10121a`). That's the background colour of the whole game.

## The game scene

Click **Other Node** in the Scene dock, pick `Node2D`, rename it to `Game` and save it as `game.tscn`. Press <kbd>F5</kbd> and choose **Select Current** when Godot asks for a main scene. You should get an empty dark window.

```quiz
question: Which settings belong in `project.godot`? Select all that apply.
type: multiple
options:
  - Viewport width and height
  - The main scene
  - The position of every node
  - The project name
answer: [0, 1, 3]
explain: Node positions live in the scene files (`.tscn`), not in the project settings.
```

## Checkpoint

If something doesn't work, compare your project with the reference: [Project at the end of chapter 1](./files/pong-ch1-end.zip).

Next up: [setting up the controls](../02-paddles/01-input-map.md).
