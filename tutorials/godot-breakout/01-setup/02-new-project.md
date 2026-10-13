---
title: Creating the project
description: Window size, stretch mode, and an empty game scene.
estimatedMinutes: 10
---

## Create the project

In the project manager, click **Create**, name the project `Breakout`, and choose the **Compatibility** renderer. A game made of coloured rectangles doesn't need the fancier renderers, and Compatibility is the one that runs in web browsers, which matters when we export.

## Window and resolution

Open **Project → Project Settings**, switch on **Advanced Settings** (top right), and go to **Display → Window**:

| Setting | Value | Why |
| --- | --- | --- |
| Viewport Width / Height | `640` × `360` | The game's own resolution. Every position in this tutorial is in these pixels. |
| Window Width / Height Override | `1280` × `720` | The window opens twice as big on desktop. |
| Stretch → Mode | `canvas_items` | Scales the 640×360 game up to whatever size the window is. |

```ini title="project.godot" {2-3,6}
[display]
window/size/viewport_width=640
window/size/viewport_height=360
window/size/window_width_override=1280
window/size/window_height_override=720
window/stretch/mode="canvas_items"
```

`project.godot` is a plain text file in your project folder. Everything you set in Project Settings ends up there.

:::warning[Don't skip the stretch mode]
Without `canvas_items`, the game stays 640×360 pixels in the corner of a bigger window, and fullscreen (which we add in the options chapter) looks broken.
:::

While you're in Project Settings, set **Rendering → Environment → Default Clear Color** to a very dark blue, `#0f101e`. That's the background of the whole game.

## The game scene

In the Scene dock, click **Other Node**, choose `Node2D`, rename it `Game`, and save it as `game.tscn`. Press <kbd>F5</kbd> and pick **Select Current** when Godot asks for a main scene. An empty, dark window opens. Close it and carry on.

```quiz
question: The viewport is 640×360 and the window is 1280×720. How many screen pixels wide is a 64px paddle?
type: text
answer: ["128", "128px", "128 px"]
explain: The `canvas_items` stretch mode scales everything by 1280 / 640 = 2.
```
