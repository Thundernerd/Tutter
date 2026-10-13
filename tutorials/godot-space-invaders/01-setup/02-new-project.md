---
title: Creating the project
description: A 640×360 window, crisp pixel art, and the sprites.
estimatedMinutes: 10
---

## Create the project

In the project manager, click **Create** and name the project `Space Invaders`. Pick the **Compatibility** renderer: a 2D arcade game doesn't need anything fancier, and Compatibility also runs in web browsers, which matters when we export at the end.

## Set the window size

Open **Project → Project Settings → Display → Window**. Turn on **Advanced Settings** (top right) to see every option, then set:

| Setting | Value | Why |
| --- | --- | --- |
| Viewport Width / Height | `640` × `360` | The game's logical resolution; all positions in this tutorial use it. |
| Window Width / Height Override | `1280` × `720` | Opens a bigger window on desktop. |
| Stretch → Mode | `canvas_items` | Scales the 640×360 game to fit the window. |

:::warning[Stretch mode]
Without `canvas_items`, resizing the window or going fullscreen shows the game tiny in a corner. We add a fullscreen option later, so set it now.
:::

## Crisp pixels

The sprites are tiny pixel art, scaled up to fill the window. By default Godot smooths textures when it scales them, which turns sharp pixels into a blurry mess. Open **Rendering → Textures** and set **Canvas Textures → Default Texture Filter** to **Nearest**. Every sprite in the project now keeps its hard edges.

While you're in Rendering, open **Environment** and set **Default Clear Color** to a deep blue-black (`#0a0b14`). That's the background colour of space.

Godot stores all of this in `project.godot`, a plain text file you can read:

```ini title="project.godot" {2-3,6,10}
[display]
window/size/viewport_width=640
window/size/viewport_height=360
window/size/window_width_override=1280
window/size/window_height_override=720
window/stretch/mode="canvas_items"

[rendering]

textures/canvas_textures/default_texture_filter=0
environment/defaults/default_clear_color=Color(0.039, 0.043, 0.078, 1)
```

## The sprites

Download the art: [space-invaders-sprites.zip](./files/space-invaders-sprites.zip). Unzip it into your project folder so you get a `sprites/` folder next to `project.godot`. Godot imports the PNGs as soon as you switch back to the editor.

| Files | What |
| --- | --- |
| `squid_1/2`, `crab_1/2`, `octopus_1/2` | The three invaders, two animation frames each |
| `player`, `player_explosion_1/2` | The laser cannon, and the two frames of its explosion |
| `invader_explosion` | The burst an invader leaves behind |
| `bomb_1/2` | The invaders' zig-zag shot |
| `ufo` | The mystery ship |
| `bunker` | One undamaged shield |

The art is drawn at 2× scale (each "pixel" of the original design is a 2×2 block), so nodes in this project never need to be scaled.

:::tip[Your own art]
Any image editor works. Keep the same sizes (an invader is 16 to 24 pixels wide and 16 tall) and the positions in this tutorial still fit.
:::

## The game scene

Click **Other Node** in the Scene dock, pick `Node2D`, rename it to `Game` and save it as `game.tscn`. Press <kbd>F5</kbd> and choose **Select Current** when Godot asks for a main scene. You should get an empty, very dark window.

```quiz
question: Your sprites look blurry when the game window is big. Which setting fixes it?
options:
  - Stretch mode `canvas_items`
  - Default Texture Filter `Nearest`
  - The Compatibility renderer
answer: 1
explain: The texture filter decides how pixels are sampled when a texture is scaled. **Nearest** picks the closest pixel instead of blending neighbours.
```
