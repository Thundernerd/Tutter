---
title: Menus
summary: A main menu with the score table, a pause menu, a game over screen and a wave banner.
---

Godot's UI nodes all inherit from `Control`. Instead of positioning each button by hand, you nest them in **containers** that lay out their children automatically:

| Container | Does |
| --- | --- |
| `CenterContainer` | Centres its child |
| `VBoxContainer` / `HBoxContainer` | Stacks children vertically / horizontally |
| `GridContainer` | Arranges children in N columns |

The HUD in the previous chapter positioned its labels by hand, which is fine for a fixed 640×360 screen. Menus have more parts, and containers keep them tidy.
