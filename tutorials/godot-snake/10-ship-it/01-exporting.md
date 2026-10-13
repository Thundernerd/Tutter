---
title: Exporting
description: Export templates, presets, and a game you can share.
estimatedMinutes: 15
---

So far the game only runs inside the editor. **Exporting** turns it into a program anyone can run, without Godot installed.

## Export templates

Godot exports your game using ready-made engine builds called **export templates**. Open **Editor → Manage Export Templates** and click **Download and Install**. You only need to do this once per Godot version.

## Presets

Open **Project → Export…**, click **Add…** and choose a platform. You can add several:

| Platform | What you get |
| --- | --- |
| Windows Desktop | A `.exe` plus a `.pck` file with the game data. Turn on **Embed PCK** for a single file. |
| macOS | A `.zip` containing `Snake.app`. Without code signing, players must right-click → **Open** the first time. |
| Linux | A program plus a `.pck` file. |
| Web | An `.html` page plus engine files, to put on a website. |

Pick a preset, click **Export Project**, choose an empty folder **outside** your project folder, and run the result. Your settings and high score now live in the real `user://` folder for that platform, separate from the editor's.

:::warning[Web builds]
A web export needs a web server; double-clicking `index.html` won't work. Run `python3 -m http.server` in the export folder and open the address it prints, or upload the folder to [itch.io](https://itch.io), which hosts Godot web games for free. Remember: the Quit button hides itself on the web.
:::

:::tip
Keep exports out of your project folder. Otherwise Godot tries to import the exported files as part of the project.
:::

## What you've learned

Look back at what you built:

| Idea | Where you used it |
| --- | --- |
| Nodes, scenes, instancing | The board, the snake, the HUD and menus |
| Grid coordinates vs pixels | `Board.cell_rect`, `cell_center`, `Vector2i` |
| Custom drawing | The board, the snake and the food, all with `_draw()` |
| Arrays and dictionaries | The body, the turn queue, `DIRECTIONS` |
| Timers and fixed ticks | `MoveTimer` and its changing `wait_time` |
| Input actions and events | Steering, input buffering, pausing, rebinding |
| Signals | Timer, buttons, and your own `turned` signal |
| UI containers and focus | Main menu, pause, game over, options |
| Autoloads and saving | `HighScore` and `Settings` with `ConfigFile` |
| Tweens and particles | The pop-in, the score bump and the crash |

## Where to go from here

Some ideas to keep going with Snake:

- **Separate high scores** for wrap-around mode and each speed level. `ConfigFile` keys like `"best_wrap_fast"` make that a small change.
- **Obstacles**: a few wall cells inside the board. They're just another array of cells to check, and to leave out of `free_cells`.
- **Golden food** that's worth 3 points but disappears after a few seconds (a one-shot `Timer` on the food).
- **Two snakes** on one keyboard, each with its own actions. The `Snake` script is already reusable.
- **Gamepad support** in the rebinding screen: accept `InputEventJoypadButton` too.

Ready for something with physics? [Pong in Godot 4](../../godot-pong/tutorial.md) builds on everything here and adds collisions, bouncing and a CPU opponent.

The complete project, for reference: [snake-complete.zip](./files/snake-complete.zip).

```quiz
type: text
question: What do you need to install once before Godot can export a game?
answer: ["export templates", "templates", "export template", "the export templates"]
hint: Editor → Manage …
```

```quiz
question: Why does the web build hide the Quit button?
options:
  - Web builds can't run code on buttons
  - A game in a browser tab can't close the tab
  - Quitting would delete the save file
answer: 1
```
