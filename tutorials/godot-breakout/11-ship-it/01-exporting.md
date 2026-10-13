---
title: Exporting
description: Export templates, presets, web builds, and what to build next.
estimatedMinutes: 15
---

## Export templates

Godot builds your game by combining it with a prebuilt engine for each platform, the **export templates**. Open **Editor → Manage Export Templates** and click **Download and Install**. You do this once per Godot version.

## Presets

Open **Project → Export…**, click **Add…**, and pick the platforms you want:

| Platform | You get | Notes |
| --- | --- | --- |
| Windows Desktop | `Breakout.exe` + `Breakout.pck` | Tick **Embed PCK** for a single file. |
| macOS | A `.zip` with `Breakout.app` | Unsigned apps need right-click → **Open** the first time. |
| Linux | A binary + `.pck` | Mark the binary as executable. |
| Web | An `.html` page and its engine files | Must be served over HTTP. |

Click **Export Project**, choose a folder **outside** your project folder, and run the result.

Your custom resources (`bricks/*.tres`, `levels/*.tres`) are packed into the game automatically, because scenes refer to them. The two save files are not: they're created at runtime in `user://`, in the player's own data folder, so every player has their own settings and high score.

:::warning[Web builds]
A web export needs a web server: double-clicking `index.html` won't work. Run `python3 -m http.server` in the export folder and open the address it prints, or upload the folder to [itch.io](https://itch.io), which hosts Godot web games for free. On the web, `user://` lives in the browser's storage, and the Quit button hides itself.
:::

## What you built

Scenes and instancing, from the editor and from code. `CharacterBody2D`, `StaticBody2D` and `Area2D`, with collision layers. Signals, bound arguments and deferred calls. Custom resources, typed arrays and dictionaries. Enums, static functions and lambdas. Containers, themes, pausing and process modes. An autoload, `ConfigFile` saves, audio buses, runtime input remapping. Timers, tweens, particles and a camera. That's most of what goes into any 2D Godot game.

## Ideas to keep going

- **More power-ups.** A laser paddle (spawn small bullets that call `hit()` on bricks: duck typing pays off), a sticky paddle (set the ball's `held_by` when it lands), or an extra life. Each is a new `Kind` and one more `match` branch.
- **Moving bricks.** Give `BrickType` a speed and let some bricks slide back and forth. Make those bricks an `AnimatableBody2D`, the body type meant for moving obstacles; the ball just bounces off whatever is there.
- **A level editor.** Levels are just text. A `TextEdit` and a "Play" button that builds a `Level` resource on the fly is a surprisingly small project.
- **Gamepad support.** Add joypad events to the actions and to the rebinding screen.
- **Your own levels.** Make a `level_05.tres` and add it to the **Levels** list. No code required.

The complete project, for reference: [breakout-complete.zip](./files/breakout-complete.zip).

```quiz
question: What do you need to download once before Godot can export a game?
type: text
answer: ["export templates", "export template", "templates"]
hint: Editor → Manage …
```

```quiz
question: After exporting, where does the game save the high score?
options:
  - Next to the exported .exe
  - In the player's user:// data folder
  - Inside the .pck file
answer: 1
explain: '`res://` (and the `.pck`) is read-only. Saves always go to `user://`.'
```
