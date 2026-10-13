---
title: Exporting
description: Export templates, presets, the project icon, and builds you can share.
estimatedMinutes: 15
---

## An icon

The art pack's script also draws a 128×128 `icon.png` (a bomb on green). Put it in the project root and set **Project Settings → Application → Config → Icon** to `res://icon.png`. Godot uses it for the window, the taskbar and, on export, the executable.

## Export templates

Godot exports using prebuilt engine binaries called **export templates**. Open **Editor → Manage Export Templates** and click **Download and Install**. It's a one-time download per Godot version.

## Presets

Open **Project → Export…**, click **Add…** and choose your platforms:

| Platform | Notes |
| --- | --- |
| Windows Desktop | A `.exe` and a `.pck`. Enable **Embed PCK** for a single file. |
| macOS | A `.zip` containing `Blast Grid.app`. Without code signing, players must right-click → Open the first time. |
| Linux | A binary plus `.pck`; mark it executable. |
| Web | An `.html` page plus engine files, served over HTTP. |

Click **Export Project**, pick a folder *outside* the project, and run the result. Settings saved to `user://` now land in the real per-user folder for that platform, so your options and key bindings carry over between launches of the exported game.

:::warning[Web builds]
A web export needs a web server: double-clicking `index.html` won't work. Run `python3 -m http.server` in the export folder, or upload it to [itch.io](https://itch.io), which hosts Godot web games for free. This is where the **Compatibility** renderer from chapter 1 pays off, and the Quit button already hides itself in browsers. Two players on one keyboard works fine in a browser, too.
:::

## Where to go from here

You've built a complete arena game: tile-based levels painted in the editor and changed from code, grid movement with corner sliding, chain reactions, a planning AI, match flow across scene reloads, menus, saved settings and rebinding for two players. Some ideas to keep going:

- **Kicking bombs**: a power-up that lets a bomber push a bomb, which then slides cell by cell until it hits something. The bomb becomes a mover, a lot like the monster.
- **Remote detonators**: bombs that wait for a second key press instead of a fuse. `Bomb.explode()` is already public.
- **Smarter CPUs**: avoid cells a rival could trap, or predict where a fleeing rival will go. The danger map and `blast_cells` give you everything you need.
- **Gamepads**: accept `InputEventJoypadButton` in the rebinding screen (see the tip in the options chapter), and four players stop being a dream.
- **More arenas**: a second `arena.tscn` with a different wall layout. `spawn_cells`, `generate` and `spiral_cells` all read the layers, so nothing in the code assumes 17×13.

The complete project, for reference: [blast-grid-complete.zip](./files/blast-grid-complete.zip).

```quiz
question: What do you need to install once before Godot can export a game?
type: text
answer: ["export templates", "templates", "export template", "the export templates"]
hint: Editor → Manage …
```

```quiz
question: Why does the web export of Blast Grid work without changes?
type: multiple
options:
  - The project uses the Compatibility renderer
  - The Quit button hides itself on the web
  - Settings are saved to user://, which browsers support
  - Web exports don't need input actions
answer: [0, 1, 2]
explain: In a browser, `user://` is backed by the browser's storage (IndexedDB), so settings still persist.
```
