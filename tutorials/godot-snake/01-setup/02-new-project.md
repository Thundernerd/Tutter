---
title: Creating the project
description: A first look at the editor, the window settings, and the game scene.
estimatedMinutes: 15
---

## Create the project

In the project manager, click **Create**. Name the project `Snake`, pick an empty folder for it, and choose the **Compatibility** renderer. The renderer is the part of Godot that draws the screen; Compatibility is the simplest one, runs on older computers, and is the only one that works in web browsers, which matters when we export at the end.

## Finding your way around

The editor looks busy at first. You only need five areas:

| Area | Where | What it's for |
| --- | --- | --- |
| **Scene** dock | top left | The nodes in the scene you're editing, as a tree |
| **FileSystem** dock | bottom left | The files in your project folder |
| **Viewport** | centre | A visual view of the scene; switch to **2D** at the top |
| **Inspector** | right | The properties of whatever node is selected |
| **Output** panel | bottom | Messages from the running game, including errors |

Two words come up constantly:

- A **node** is a single building block with one job: a `Timer` counts time, a `Label` shows text, a `Node2D` has a position on screen. Godot has hundreds of node types.
- A **scene** is a tree of nodes saved as a `.tscn` file. Your game will have a few: the game itself, a menu, a score display... Scenes can contain other scenes.

## Set the window size

Open **Project → Project Settings**. Turn on **Advanced Settings** (top right) to see every option, then go to **Display → Window** and set:

| Setting | Value | Why |
| --- | --- | --- |
| Viewport Width / Height | `640` × `360` | The game's own resolution. Every position in this tutorial uses it. |
| Window Width / Height Override | `1280` × `720` | Opens a bigger window on desktop. |
| Stretch → Mode | `canvas_items` | Scales the 640×360 game up to fill the window. |

Why so small? 640×360 is exactly half of 1280×720 and a third of 1920×1080, so the game scales up cleanly to common screens, and small numbers are easier to reason about.

Godot stores these settings in `project.godot`, a plain text file in your project folder:

```ini title="project.godot" {2-3,6}
[display]
window/size/viewport_width=640
window/size/viewport_height=360
window/size/window_width_override=1280
window/size/window_height_override=720
window/stretch/mode="canvas_items"
```

:::warning[Stretch mode]
Without `canvas_items`, making the window bigger or going fullscreen shows the game tiny in a corner. We add a fullscreen option later, so set it now.
:::

While you're in Project Settings, open **Rendering → Environment** and set **Default Clear Color** to `#10121a`, a dark blue-black. That's the background colour of the whole game.

## The game scene

In the Scene dock, click **Other Node**, search for `Node2D` and create it. Double-click the new node and rename it to `Game`. Save the scene with <kbd>Ctrl</kbd>+<kbd>S</kbd> (<kbd>Cmd</kbd>+<kbd>S</kbd> on macOS) as `game.tscn`.

`Node2D` is the basic node for anything in a 2D game: it has a position, a rotation and a scale, and children move along with it. `Game` will hold the board, the snake and the food.

Press <kbd>F5</kbd> (or the ▶ button at the top right) to run the project. Godot asks which scene to start with; choose **Select Current**. You should get an empty, dark window. Close it, or press <kbd>F8</kbd> in the editor.

:::note
If the editor complains that no main scene is defined, set it in **Project Settings → Application → Run → Main Scene**. That's the same setting **Select Current** fills in.
:::

```quiz
question: What is a scene in Godot?
options:
  - A single node with a script
  - A tree of nodes, saved as a .tscn file
  - The window the game runs in
  - Another name for a level
answer: 1
explain: A scene is a tree of nodes. It can be a level, but also a menu, a score display or a single enemy; scenes can contain other scenes.
```

```quiz
question: Which settings live in `project.godot`? Select all that apply.
type: multiple
options:
  - The viewport size
  - The main scene
  - The position of every node
  - The project name
answer: [0, 1, 3]
explain: Node positions belong to the scene files (`.tscn`), not to the project settings.
```
