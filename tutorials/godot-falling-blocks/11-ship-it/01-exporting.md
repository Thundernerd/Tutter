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
| macOS | Produces a `.zip` containing `Blockfall.app`. Without code signing, players must right-click → Open the first time. |
| Linux | A binary plus `.pck`; mark it executable. |
| Web | An `.html` page plus engine files. Needs to be served over HTTP. |

Click **Export Project**, pick a folder outside your project, and run the result. Settings and high scores saved to `user://` now land in the real per-user folder for the platform, separate from the ones you made while testing in the editor.

:::warning[Web builds]
Web exports need a web server; double-clicking `index.html` won't work. Run `python3 -m http.server` in the export folder, or upload to [itch.io](https://itch.io), which hosts Godot web games for free. Remember: our Quit button hides itself on the web, and `user://` maps to the browser's storage, so high scores survive as long as the player doesn't clear their site data.
:::

:::note[Naming your game]
If you publish your own falling blocks game, give it your own name and look, as we did with Blockfall. Calling it something-"tris", or copying another game's logo, is exactly what trademark holders in this genre act against. Describing it as "Tetris-style" in a sentence is fine; using the name as your title isn't.
:::

## Where to go from here

You've built a complete game on a data model you fully control: a grid of numbers, pieces as small immutable values, and rules that only ever ask "would this fit?". Along the way you used custom drawing, Timer nodes, autoloads, ConfigFile, containers, unique names, input remapping, audio buses, signals, tweens, coroutines and exporting. Some ideas to keep going:

- **T-spins and combos.** Detect a T piece that locked right after a rotation with three of its four box corners filled, and reward it. Award bonus points for consecutive clears ("combos") and for back-to-back four-line clears.
- **Game modes.** *Sprint*: clear 40 lines as fast as possible, with a timer instead of a score. *Ultra*: score as much as you can in two minutes.
- **A starting level option** in the options screen, for players who find level 1 too slow.
- **Gamepad support** in the rebinding screen (see the tip in the rebinding page).
- **Particles**: a `GPUParticles2D` burst along each cleared row.
- **Tests.** The board, the pieces and the bag don't need the scene tree at all. A handful of tests that place pieces and check the grid are the best way to keep rotation and clearing correct while you add features.

The complete project for reference: [blockfall-complete.zip](./files/blockfall-complete.zip).

```quiz
question: What do you need to install once before Godot can export a game?
type: text
answer: ["export templates", "templates", "export template", "the export templates"]
hint: Editor → Manage …
```

```quiz
question: Where do a player's high scores live in an exported desktop build?
options:
  - Inside the exported .pck file
  - In the per-user user:// folder for that platform
  - Next to the executable
answer: 1
```
