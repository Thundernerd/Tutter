---
title: Exporting
description: Export templates, presets, and builds you can share.
estimatedMinutes: 15
---

## Export templates

Godot exports using prebuilt engine binaries called **export templates**. Open **Editor → Manage Export Templates** and click **Download and Install**. It's a one-time download per Godot version.

## Presets

Open **Project → Export…**, click **Add…** and choose your platforms:

| Platform | Notes |
| --- | --- |
| Windows Desktop | Produces a `.exe` and a `.pck` file. Enable **Embed PCK** for a single file. |
| macOS | Produces a `.zip` containing `Pong.app`. Without code signing, players must right-click → Open the first time. |
| Linux | A binary plus `.pck`; mark it executable. |
| Web | An `.html` page plus engine files. Needs to be served over HTTP. |

Click **Export Project**, pick a folder outside your project, and run the result. Settings saved to `user://` now land in the real per-user folder for the platform.

:::warning[Web builds]
Web exports need a web server; double-clicking `index.html` won't work. Run `python3 -m http.server` in the export folder, or upload to [itch.io](https://itch.io), which hosts Godot web games for free. Remember: our Quit button hides itself on the web.
:::

## Where to go from here

You've used most of the building blocks of a 2D Godot game: scenes and instancing, physics bodies and areas, signals, UI containers, autoloads, saving data, input remapping, audio buses, tweens and exporting. Some ideas to keep going:

- **Difficulty levels** for the CPU (see the tip in the CPU chapter).
- **Gamepad support** in the rebinding screen.
- **Particles**: a `GPUParticles2D` burst when the ball hits a paddle.
- **A different game**: Breakout reuses the paddle, the ball and the bounce angle code almost unchanged.

The complete project for reference: [pong-complete.zip](./files/pong-complete.zip).

```quiz
question: What do you need to install once before Godot can export a game?
type: text
answer: ["export templates", "templates", "export template"]
hint: Editor → Manage …
```
