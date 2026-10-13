---
title: Creating the project
description: A 640×360 window that keeps pixel art crisp.
estimatedMinutes: 10
---

## Create the project

In the project manager, click **Create**, name the project `Blast Grid` and pick the **Compatibility** renderer. It runs everywhere, including web browsers, which we'll want when exporting.

:::tip[The project name matters]
Godot uses the project name for the folder where your game saves data (`user://`). Naming it now means the settings we save later land in a `Blast Grid` folder instead of `[unnamed project]`.
:::

## The window

Open **Project → Project Settings**, turn on **Advanced Settings**, and set:

| Setting | Value | Why |
| --- | --- | --- |
| Display → Window → Viewport Width / Height | `640` × `360` | The game's logical resolution; every position in this tutorial uses it. |
| Display → Window → Window Width / Height Override | `1280` × `720` | Opens a bigger window on desktop. |
| Display → Window → Stretch → Mode | `canvas_items` | Scales the 640×360 game to fit any window. |
| Rendering → Textures → Canvas Textures → Default Texture Filter | `Nearest` | Keeps pixel art sharp instead of blurry when scaled. |
| Rendering → Environment → Default Clear Color | `#10121a` | The dark background behind the arena. |

The arena uses 24×24 pixel tiles, and at 1280×720 every pixel becomes a crisp 2×2 block, but only with the **Nearest** filter. The default, *Linear*, blends neighbouring pixels and makes tiles look smeared.

These settings are saved in `project.godot`, a plain text file:

```ini title="project.godot"
[application]
config/name="Blast Grid"

[display]
window/size/viewport_width=640
window/size/viewport_height=360
window/size/window_width_override=1280
window/size/window_height_override=720
window/stretch/mode="canvas_items"

[rendering]
textures/canvas_textures/default_texture_filter=0
renderer/rendering_method="gl_compatibility"
environment/defaults/default_clear_color=Color(0.063, 0.071, 0.094, 1)
```

`default_texture_filter=0` is *Nearest*. Godot leaves out any setting that still has its default value, which is why the file is so short.

## The game scene

Create a scene with a `Node2D` root named `Game` and save it as `game.tscn`. Press <kbd>F5</kbd> and choose **Select Current** when Godot asks for a main scene. You should get an empty, dark window.

```quiz
question: Your 24×24 tiles look blurry when the window is scaled up. Which setting fixes that?
options:
  - Stretch Mode canvas_items
  - Default Texture Filter set to Nearest
  - The Compatibility renderer
  - A bigger viewport size
answer: 1
explain: The texture filter decides how pixels are sampled when scaled. **Nearest** picks the closest pixel, so pixel art stays sharp.
```
