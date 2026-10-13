---
title: Exporting
description: Export templates, presets, and builds you can share.
estimatedMinutes: 15
---

## Before you export

Two quick checks:

- **Turn off the debug overlay**, or at least decide whether players should have it. `TargetDebug` starts hidden and only appears on <kbd>F1</kbd>, so it's harmless, but you may prefer to remove the `toggle_targets` action (or the node) from the release.
- **Untick Use Pathfinding** on every ghost, if you left it on after chapter 5.

## Export templates

Godot exports using prebuilt engine binaries called **export templates**. Open **Editor → Manage Export Templates** and click **Download and Install**. It's a one-time download per Godot version.

## Presets

Open **Project → Export…**, click **Add…** and choose your platforms:

| Platform | Notes |
| --- | --- |
| Windows Desktop | Produces a `.exe` and a `.pck` file. Enable **Embed PCK** for a single file. |
| macOS | Produces a `.zip` containing `Maze Muncher.app`. Without code signing, players must right-click → Open the first time. |
| Linux | A binary plus `.pck`; mark it executable. |
| Web | An `.html` page plus engine files. Needs to be served over HTTP. |

Click **Export Project**, pick a folder outside your project, and run the result. The settings and high score now land in the real per-user folder for the platform (the `user://` paths from chapter 8).

:::warning[Web builds]
Web exports need a web server; double-clicking `index.html` won't work. Run `python3 -m http.server` in the export folder, or upload to [itch.io](https://itch.io), which hosts Godot web games for free. On the web, `user://` is stored in the browser, and the Quit button hides itself.
:::

:::note[Sharing a game "in the style of"]
Maze Muncher is our own game: its own maze, names, art and sounds. If you build on it and publish, keep it that way. Classic arcade games' names, characters and artwork are usually trademarked or copyrighted, but game mechanics like "eat the pellets, avoid the ghosts" are not.
:::

## Where to go from here

You've built a complete arcade game, and used a lot of Godot along the way: TileMapLayers filled from data, grid movement, inheritance with `class_name`, state machines, Timer nodes, process modes for freezing and pausing, coroutines with `await`, autoloads and `ConfigFile`, input remapping, audio buses, and tweens. Some ideas to keep going:

- **Cornering**: let the player start turns a few pixels before the centre (see the tip in chapter 3).
- **More mazes**: `LAYOUT` is just text. Make an array of layouts and switch maze every few levels. Remember: no dead ends, and corridors exactly one tile wide.
- **A final rush**: in the arcade original, the red ghost sped up when only a few pellets were left. Here that's one `if` in `_apply_level_speeds` plus a check after each pellet.
- **Intermissions**: a short animated scene between levels, built with an `AnimationPlayer`.
- **Gamepad support** in the rebinding screen (accept `InputEventJoypadButton` too).

The complete project for reference: [maze-muncher-complete.zip](./files/maze-muncher-complete.zip).

```quiz
question: What do you need to install once before Godot can export a game?
type: text
answer: ["export templates", "templates", "export template"]
hint: Editor → Manage …
```

```quiz
question: Which of these did Maze Muncher use to freeze everything in the maze at once?
options:
  - get_tree().paused
  - Engine.time_scale = 0
  - Setting World's process mode to Disabled
answer: 2
explain: Pausing the tree is reserved for the pause menu; disabling World freezes only the maze, so the HUD, sounds and wait timer keep running.
```
