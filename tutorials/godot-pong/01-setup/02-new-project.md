---
title: Creating the project
description: Configure the window and add a main scene.
estimatedMinutes: 10
---

## Create the project

In the project manager, click **Create** and name the project `Pong`. Pick the **Compatibility** renderer; Pong doesn't need anything fancier.

## Set the window size

Open **Project → Project Settings → Display → Window** and set the viewport to 640×360. The settings end up in `project.godot`:

```ini title="project.godot" {2-3}
[display]
window/size/viewport_width=640
window/size/viewport_height=360
```

:::warning[Stretch mode]
Set **Stretch → Mode** to `canvas_items` as well, otherwise the game will not scale when you resize the window.
:::

## The main scene

Create a new scene with a `Node2D` root called `Main` and save it as `main.tscn`. Then press <kbd>F5</kbd> and choose it as the main scene.

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

Next up: [making the paddles move](../02-paddles/01-paddle-scene.md).
