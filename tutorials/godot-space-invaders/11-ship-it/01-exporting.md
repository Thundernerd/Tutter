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
| macOS | Produces a `.zip` containing `Space Invaders.app`. Without code signing, players must right-click → Open the first time. |
| Linux | A binary plus `.pck`; mark it executable. |
| Web | An `.html` page plus engine files. Needs to be served over HTTP. |

Click **Export Project**, pick a folder outside your project, and run the result. The settings and high score saved to `user://` now land in the real per-user folder for the platform; in a web build, they're kept in the browser's storage.

:::warning[Web builds]
Web exports need a web server; double-clicking `index.html` won't work. Run `python3 -m http.server` in the export folder, or upload to [itch.io](https://itch.io), which hosts Godot web games for free. Remember: our Quit button hides itself on the web.
:::

:::tip[Test the exported build]
Play a full game in the exported version before you share it. Some problems only show up there. By default an export contains every *resource* in the project (scenes, scripts, images, sounds), but files Godot doesn't import, like a `.json` or `.txt` you read yourself, are left out unless you list them under **Resources → Filters to export non-resource files/folders** in the preset.
:::

## Where to go from here

You've built a complete arcade game: instancing scenes from code, timers and `await`, collision layers, signals between decoupled scenes, editing an `Image` pixel by pixel, a static helper and an autoload, saving to disk, input remapping, audio buses, particles, tweens and exporting. Some ideas to keep going:

- **Faster waves.** Lower `slowest_step` a little each wave, or give later waves more `max_shots`.
- **Smarter bombs.** The arcade had three kinds of invader shot with different speeds and patterns. Make a second shot scene and let the formation pick.
- **A two-player mode** that alternates turns, like the cabinet, with a separate score for each player.
- **Gamepad support** in the rebinding screen.
- **A high score table** with names: save an array of dictionaries in the `ConfigFile` instead of one number.

The complete project for reference: [space-invaders-complete.zip](./files/space-invaders-complete.zip).

```quiz
question: What do you need to install once before Godot can export a game?
type: text
answer: ["export templates", "templates", "export template"]
hint: Editor → Manage …
```
