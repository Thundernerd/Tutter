---
title: Creating the project
description: Renderer, window size, stretch mode, and an empty race scene.
estimatedMinutes: 10
---

## Create the project

In the project manager, click **Create**, name the project `Tiny Racers`, and pick the **Compatibility** renderer. Everything in this game is flat 2D shapes, and Compatibility is the renderer that also runs in web browsers, which matters when we export at the end.

:::note[Why the name matters]
Godot uses the project name for the folder where your game saves data (settings and lap records, later on). Two projects with the same name would share that folder, so give each project its own name.
:::

## Window and stretch

Open **Project → Project Settings → Display → Window**, turn on **Advanced Settings** (top right), and set:

| Setting | Value | Why |
| --- | --- | --- |
| Viewport Width / Height | `640` × `360` | The game's logical resolution. Every position and size in this tutorial uses it. |
| Window Width / Height Override | `1280` × `720` | Opens a bigger window on desktop. |
| Stretch → Mode | `canvas_items` | Scales the 640×360 game up to fit the window, sharp at any size. |

A 640×360 viewport makes the cars genuinely tiny: about 22 pixels long. That's the Micro Machines look, and it means a track much bigger than the screen, so we'll need a camera that follows the action.

Godot stores these in `project.godot`, a plain text file:

```ini title="project.godot" {2-3,6}
[display]
window/size/viewport_width=640
window/size/viewport_height=360
window/size/window_width_override=1280
window/size/window_height_override=720
window/stretch/mode="canvas_items"
```

:::warning[Stretch mode]
Without `canvas_items`, a bigger window just shows more empty space around a 640×360 game. With it, the game scales to fill the window. We add a fullscreen option later, so set it now.
:::

## Background colour

Under **Rendering → Environment**, set **Default Clear Color** to a very dark blue-grey, `#14161c`. That's the "floor" you'll see around the edges of each table.

## The race scene

In the Scene dock, click **Other Node**, pick `Node2D`, rename it to `Race`, and save it as `race.tscn`. This scene will grow into the whole race: track, cars, camera and HUD.

Press <kbd>F5</kbd> and choose **Select Current** when Godot asks for a main scene. You should see an empty dark window. (Later, the main menu takes over as the main scene.)

```quiz
question: The viewport is 640×360 and the window is 1280×720. With stretch mode `canvas_items`, how big does a 22 px car appear on screen?
options:
  - 11 px
  - 22 px
  - 44 px
answer: 2
explain: The game is drawn at 640×360 and scaled 2× to fill 1280×720, so everything appears twice as large.
```
