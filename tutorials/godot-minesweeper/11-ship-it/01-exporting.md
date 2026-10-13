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
| macOS | Produces a `.zip` containing `Minesweeper.app`. Without code signing, players must right-click → Open the first time. |
| Linux | A binary plus `.pck`; mark it executable. |
| Web | An `.html` page plus engine files. Needs to be served over HTTP. |

Click **Export Project**, pick a folder outside your project, and run the result. Settings and best times saved to `user://` now land in the real per-user folder for the platform; in a web build, they're stored in the browser.

:::warning[Web builds]
Web exports need a web server; double-clicking `index.html` won't work. Run `python3 -m http.server` in the export folder, or upload to [itch.io](https://itch.io), which hosts Godot web games for free. Remember: the Quit button hides itself on the web.
:::

:::note[Right-clicks in the browser]
Browsers normally open a context menu on right-click. Godot's web export suppresses it on the game canvas, so right-click flagging works as it does on desktop.
:::

## Before you share it

A quick checklist that's easy to forget:

- **Main scene** is `main_menu.tscn`, not the game scene you were testing with <kbd>F6</kbd>.
- **Project name** is `Minesweeper`: it names the `user://` folder, so changing it after release would make players lose their settings and records.
- **Fullscreen** works and the 640×360 layout scales cleanly: try a few window sizes.
- Play one game on each difficulty in the **exported** build, not just in the editor.

## Where to go from here

You've built a complete game without a single physics body: a data model with its own rules, a custom-drawn `Control`, three classic grid algorithms (shuffling, neighbour counting and flood fill), containers, themes and type variations, signals, two autoloads, saving data, input remapping, audio buses, tweens, particles and exporting. Some ideas to keep going:

- **No-guess boards**: some versions generate only boards that can be solved by logic alone. Write a solver that applies the simple rules (a number with as many hidden neighbours as remaining mines: flag them all; a satisfied number: reveal the rest), and regenerate the board until the solver can finish it from the first click.
- **Hints**: run the same solver for one step and highlight a cell that is provably safe.
- **Statistics**: games played, win percentage and current streak per difficulty, in `Records`.
- **Hexagonal Minesweeper**: the grid's shape lives in only a few places: `neighbours()` in the model, and `_cell_rect`, `_cell_at` and the cell drawing in the board. Give them hex versions and mine placement, flood fill, chording and the win check work unchanged.
- **A different game**: the model/board split, the grid helpers and the flood fill carry straight over to Snake, match-3 puzzles, or a tile-based level editor.

The complete project for reference: [minesweeper-complete.zip](./files/minesweeper-complete.zip).

```quiz
question: What do you need to install once before Godot can export a game?
type: text
answer: ["export templates", "templates", "export template"]
hint: Editor → Manage …
```

```quiz
question: Why shouldn't you rename the project after releasing the game?
options:
  - Exports would stop working
  - The project name decides the user:// folder, so players' saved settings and records would seem to disappear
  - Godot doesn't allow renaming projects
answer: 1
explain: user:// is per project name. A new name means a new, empty folder.
```
