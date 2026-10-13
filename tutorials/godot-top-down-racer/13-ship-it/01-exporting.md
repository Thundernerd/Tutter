---
title: Exporting
description: Export templates, presets, builds you can share, and what to build next.
estimatedMinutes: 15
---

## Export templates

Godot exports games using prebuilt engine binaries called **export templates**. Open **Editor → Manage Export Templates** and click **Download and Install**. You do this once per Godot version.

## Presets

Open **Project → Export…**, click **Add…**, and choose your platforms:

| Platform | Notes |
| --- | --- |
| Windows Desktop | A `.exe` plus a `.pck` data file. Turn on **Embed PCK** for a single file. |
| macOS | A `.zip` containing `Tiny Racers.app`. Without code signing, players need to right-click → **Open** the first time. |
| Linux | A binary plus `.pck`. Mark it executable. |
| Web | An `.html` page plus engine files. It must be served over HTTP. |

Click **Export Project**, choose a folder **outside** the project, and run the result. Settings and lap records now save to the real per-user folder for that platform (`app_userdata/Tiny Racers`).

:::warning[Web builds]
A web export needs a web server: double-clicking `index.html` won't work. Run `python3 -m http.server` in the export folder, or upload it to [itch.io](https://itch.io), which hosts Godot web games for free. Two things to know: the Quit button hides itself on the web, and browsers only allow sound after the first click or key press, so the main menu's first sound may be silent.
:::

:::tip[Two players, one keyboard]
Some keyboards can't register many keys at once ("ghosting"). If P1's steering stops responding while P2 holds three arrow keys, that's the keyboard's hardware, not your game. Rebinding P1 to keys further from the arrows usually helps, and the options screen makes that easy.
:::

## What you built

Tiny Racers uses a lot of Godot: `CharacterBody2D` physics with custom handling, curves and `Line2D`, tool scripts that draw in the editor, `Area2D` triggers, custom `Resource` types, two autoloads, `ConfigFile` saving, runtime input rebinding, a smoothed and zooming camera, tweens, particles, positional audio, and a menu flow with pausing.

The ideas matter more than the nodes, though:

- **The curve is the track.** One `Curve2D` gave us the road, off-road detection, checkpoints, the starting grid, CPU steering and braking, race positions, and head-to-head restarts.
- **Split velocity into parts you understand.** Forward and sideways speed, each with its own rule, is the whole arcade drift model.
- **Signals keep pieces independent.** The track doesn't know about laps, the HUD doesn't know about checkpoints, and the car doesn't know what plays its bump sound.

## Where to go from here

- **Gamepads**: add joypad events to the input actions, and accept `InputEventJoypadButton` in the rebinding screen.
- **More cars**: different `max_speed`, `grip` and `turn_speed` per car: a grippy go-kart, a sliding muscle car. They're all exports already.
- **A ghost car**: record the player's position every tick on their best lap, and replay it as a transparent car next time.
- **Weapons and power-ups**: an `Area2D` pickup that gives a temporary `max_speed` boost is ten lines.
- **Four players**: the camera already zooms to fit everyone. Add `p3_` and `p4_` actions, colours and HUD panels.
- **New tables**: a garden, a bathtub, a sandpit... Build the scene, make a `TrackInfo`, add a line to `TRACKS`.

The complete project for reference: [tiny-racers-complete.zip](./files/tiny-racers-complete.zip).

```quiz
question: What do you need to install once before Godot can export a game?
type: text
answer: ["export templates", "templates", "export template"]
hint: Editor → Manage …
```

```quiz
question: Where does an exported Tiny Racers save its settings and lap records?
options:
  - Next to the executable
  - In the per-user app data folder, under "Tiny Racers"
  - Inside the .pck file
answer: 1
explain: '`user://` maps to the platform''s per-user data folder. The `.pck` and the game folder may be read-only, so nothing is ever saved there.'
```
